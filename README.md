# Getting Started

Welcome to your new project.

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`srv/` | your service models and code go here
`package.json` | project metadata and configuration
`readme.md` | this getting started guide


## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start adding content, for example, a [db/schema.cds](db/schema.cds).


## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.

https://apac.cockpit.btp.cloud.sap/cockpit#/globalaccount/e2f52f97-3e7e-4227-a39a-c2e9e04d8f11/subaccount/2be50464-614b-49a8-9fad-e69c0ada1f1e/service-instances
_schema-version: 3.3.0
ID: cap-ext-conn
version: 1.0.0
description: "A simple CAP project."
parameters:
  enable-parallel-deployments: true
build-parameters:
  before-all:
    - builder: custom
      commands:
        - npm ci
        - npx cds build --production
modules:
  - name: cap-ext-conn-srv
    type: nodejs
    path: gen/srv
    parameters:
      instances: 1
      buildpack: nodejs_buildpack
    build-parameters:
      builder: npm-ci
    provides:
      - name: srv-api # required by consumers of CAP services (e.g. approuter)
        properties:
          srv-url: ${default-url}
    requires:
      - name: S4HANA_100_dest
      - name: S4HANA_100_conn
      - name: cap-ext-conn-auth
      - name: cap-ext-conn-pgSQL
  - name: cap-ext-conn
    type: approuter.nodejs
    path: app/router
    parameters:
      keep-existing-routes: true
      disk-quota: 256M
      memory: 256M
    requires:
      - name: srv-api
        group: destinations
        properties:
          name: srv-api # must be used in xs-app.json as well
          url: ~{srv-url}
          forwardAuthToken: true
      - name: cap-ext-conn-auth
      - name: S4HANA_100_dest
    provides:
      - name: app-api
        properties:
          app-protocol: ${protocol}
          app-uri: ${default-uri}
  - name: cap-ext-conn-destination-content-deployer
    type: com.sap.application.content
    requires:
      - name: srv-api
      - name: cap-ext-conn-auth
        parameters:
          service-key:
            name: cap-ext-conn-auth-key
      - name: S4HANA_100_dest
        parameters:
          content-target: true
    parameters:
      content:
        subaccount:
          destinations:
            - Name: s4hana_cap_Dest
              Description: s4hana capm service
              Authentication: OAuth2UserTokenExchange
              ServiceInstanceName: cap-ext-conn-auth
              ServiceKeyName: cap-ext-conn-auth-key
              URL: ~{srv-api/srv-url}
              HTML5.DynamicDestination: true
              timeout: 6000
              WebIDEUsage: odata_gen
              WebIDEEnabled: true
          existing_destinations_policy: update
    build-parameters:
      no-source: true
  - name: cap-ext-conn-postgres-deployer
    type: nodejs
    path: gen/pg
    parameters:
      buildpack: nodejs_buildpack
      no-route: true
      no-start: true
      tasks:
        - name: deploy-to-postgresql
          command: npm start
    requires:
      - name: cap-ext-conn-pgSQL
        parameters:
          service-key:
            name: srv-key-db
            
resources:
  - name: S4HANA_100_dest
    type: org.cloudfoundry.managed-service
    parameters:
      service: destination
      service-plan: lite
  - name: S4HANA_100_conn
    type: org.cloudfoundry.managed-service
    parameters:
      service: connectivity
      service-plan: lite
  - name: cap-ext-conn-auth
    type: org.cloudfoundry.managed-service
    parameters:
      service: xsuaa
      service-plan: application
      path: ./xs-security.json
      config:
        xsappname: cap-ext-conn-${org}-${space}
        tenant-mode: dedicated
        oauth2-configuration:
          credential-types:
            - "binding-secret"
            - "x509"
          redirect-uris:
            - https://*~{app-api/app-uri}/**
    requires:
      - name: app-api
  - name: cap-ext-conn-pgSQL
    type: org.cloudfoundry.managed-service
    parameters:
      service: postgresql-db
      service-plan: standard