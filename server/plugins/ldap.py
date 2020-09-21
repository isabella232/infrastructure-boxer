"""This is the ASF LDAP plugin for Boxer. It establishes an LDAP connection and reads project memberships.
   If a projects.yaml (or other override file specified) exists, it can read LDAP overrides from it for specific groups.

   A typical override setting would involve either an alternate LDAP base or a hardcoded list of members/owners,
   for instance:

   infrastructure:
     ldap: cn=infrastructure,ou=groups,ou=services,dc=apache,dc=org

   foundation:
     members: kp sk humbedooh
     owners: sk
"""
import bonsai
import typing
import re
import yaml
import os

UID_RE = re.compile(r"^uid=([^,]+)")


class LDAPConfig:
    uri: str
    binddn: str
    bindpw: str
    userbase: str
    ldapbase: str
    groupbase: str

    def __init__(self, subyaml: dict = {}):
        self.uri = str(subyaml.get("uri", ""))
        self.binddn = str(subyaml.get("binddn", ""))
        self.bindpw = str(subyaml.get("bindpw", ""))
        self.userbase = str(subyaml.get("userbase", ""))
        self.ldapbase = str(subyaml.get("ldapbase", ""))
        self.groupbase = str(subyaml.get("groupbase", ""))


class LDAPClient:
    config: LDAPConfig
    client: typing.Optional[bonsai.LDAPClient]
    connection: typing.Optional[bonsai.LDAPConnection]
    ldap_override: dict

    def __init__(self, config: LDAPConfig, ldap_override_yaml="projects.yaml"):
        self.config = config
        self.client = None
        self.connnection = None
        self.ldap_override = {}
        if ldap_override_yaml and os.path.exists(ldap_override_yaml):
            try:
                self.ldap_override = yaml.safe_load(open(ldap_override_yaml))
            except yaml.YAMLError as err:
                print(f"Could not load ldap override yaml, {ldap_override_yaml}: {err}")

    async def __aenter__(self):
        """Initializes an LDAP connection and returns the connection is success, None otherwise"""
        self.client = bonsai.LDAPClient(self.config.uri)
        self.client.set_credentials("SIMPLE", self.config.binddn, self.config.bindpw)
        self.client.set_cert_policy("allow")  # TODO: Load our cert(?)
        # Hack around GnuTLS bug with async... - https://github.com/noirello/bonsai/issues/25
        bonsai.set_connect_async(False)
        self.connection = await self.client.connect(is_async=True)
        bonsai.set_connect_async(True)
        return self

    async def get_members(self, group: str):
        """Async fetching of members/owners of a standard project group."""
        ldap_base = self.config.groupbase % group
        members = []
        owners = []

        if self.ldap_override and group in self.ldap_override:
            if "ldap" in self.ldap_override[group]:
                ldap_base = self.ldap_override[group]["ldap"]
                print("Using LDAP override for group %s: %s" % (group, ldap_base))
            if "members" in self.ldap_override[group]:
                members = self.ldap_override[group]["members"]
                print(f"Using membership override for group {group}: {members}")
            if "owners" in self.ldap_override[group]:
                owners = self.ldap_override[group]["owners"]
                print(f"Using ownership override for group {group}: {owners}")
        if owners and members:
            return owners, members
        try:
            assert self.connection, "LDAP Not connected"
            rv = await self.connection.search(
                ldap_base, bonsai.LDAPSearchScope.SUBTREE, None, ["member", "owner"]
            )
            if rv:
                if not members and "member" in rv[0]:
                    for member in rv[0]["member"]:
                        m = UID_RE.match(member)
                        if m:
                            members.append(m.group(1))

                if not owners and "owner" in rv[0]:
                    for owner in rv[0]["owner"]:
                        m = UID_RE.match(owner)
                        if m:
                            owners.append(m.group(1))
            return list(sorted(members)), list(sorted(owners))

        except Exception as e:
            print(f"LDAP Exception for group {group}: {e}")
            return [], []

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.connection:
            self.connection.close()
