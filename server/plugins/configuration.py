from __future__ import annotations
import plugins.basetypes
import plugins.ldap
import plugins.github
import plugins.repositories
import os
import typing


class ServerConfig:
    port: int
    ip: str

    def __init__(self, subyaml: dict):
        self.ip = subyaml.get("bind", "0.0.0.0")
        self.port = int(subyaml.get("port", 8080))


class TaskConfig:
    refresh_rate: int

    def __init__(self, subyaml: dict):
        self.refresh_rate = int(subyaml.get("refresh_rate", 150))
        assert self.refresh_rate >= 60, "Refresh rate must be at least 60 seconds!"


class OAuthConfig:
    authoritative_domains: list
    admins: list
    github_client_id: str
    github_client_secret: str

    def __init__(self, subyaml: dict):
        self.authoritative_domains = subyaml.get("authoritative_domains", [])
        self.admins = subyaml.get("admins", "").split(' ')
        self.github_client_id = subyaml.get("github_client_id", "")
        self.github_client_secret = subyaml.get("github_client_secret", "")
        assert isinstance(self.github_client_id, str), "GitHub client ID must be a string"
        assert isinstance(self.github_client_secret, str), "GitHub client secret must be a string"


class DBConfig:
    dbtype: str
    dbfile: str

    def __init__(self, subyaml: dict):
        self.dbtype = subyaml.get("dbtype", "sqlite")
        self.dbfile = subyaml.get("dbfile", "boxer.db")
        assert self.dbtype == 'sqlite', "DB type must be SQLite for now, I dunno other types"
        assert isinstance(self.dbfile, str) and os.path.exists(self.dbfile), "DB File must exist on disk!"


class GitHubConfig:
    token: str

    def __init__(self, subyaml: dict):
        self.token = subyaml.get("token", "")
        assert isinstance(self.token, str) and len(self.token) == 40, "GitHub token must be a valid token!"


class Configuration:
    server: ServerConfig
    database: DBConfig
    tasks: TaskConfig
    oauth: OAuthConfig
    repos: plugins.repositories.RepoConfig
    ldap: plugins.ldap.LDAPConfig
    github: GitHubConfig

    def __init__(self, yml: dict):
        self.server = ServerConfig(yml.get("server", {}))
        self.database = DBConfig(yml.get("database", {}))
        self.tasks = TaskConfig(yml.get("tasks", {}))
        self.oauth = OAuthConfig(yml.get("oauth", {}))
        self.repos = plugins.repositories.RepoConfig(yml.get("repositories", {}))
        self.ldap = plugins.ldap.LDAPConfig(yml.get("ldap", {}))
        self.github = GitHubConfig(yml.get("github", {}))


class InterData:
    """
        A mix of various global variables used throughout processes
    """

    repositories: list
    projects: dict
    sessions: dict
    people: dict
    mfa: dict
    teams: typing.List[plugins.github.GitHubTeam]

    def __init__(self):
        self.repositories = []
        self.sessions = {}
        self.people = {}
        self.projects = {}
        self.mfa = {}
        self.teams = []

