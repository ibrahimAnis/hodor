# Keycloak OpenFGA Event Publisher

This is a Keycloak extension that implements an Event Listener Provider to detect Identity events and publish them to the OpenFGA server over HTTP, thanks to the [OpenFGA Java SDK](https://github.com/openfga/java-sdk).  
This extension allows for direct integration between [Keycloak](https://www.keycloak.org/) and [OpenFGA](https://openfga.dev/). OpenFGA is an open source solution for Fine-Grained Authorization that applies the concept of ReBAC (created by the Auth0 inspired by Zanzibar).
The extension follows these steps:

1. Listens to the following Keycloak events based on his own Identity, Role and Group model (e.g., User Role Assignment, Role to Role Assignment, etc)
2. Converts these event into an OpenFGA Tuple key based on the [OpenFGA Authorization Schema](openfga/keycloak-authorization-model.json):
<p align="center">
  <img width="70%" height="70%" src="images/openfga-authz-model.png">
</p>

3. Publishes the Tuple keys to the OpenFGA solution using the [OpenFGA Java SDK](https://github.com/openfga/java-sdk). Apps and APIs can then use OpenFGA as a PDP (Policy Decision Endpoint) to enforce the authorization policies.

## Solution Architecture Overview (New)

This extension improves the Authorization Architecture described in the article [Keycloak integration with OpenFGA (based on Zanzibar) for Fine-Grained Authorization at Scale (ReBAC)](https://embesozzi.medium.com/keycloak-integration-with-openfga-based-on-zanzibar-for-fine-grained-authorization-at-scale-d3376de00f9a)
by enabling direct event synchronization between the Access Manager Platform and the OpenFGA Server.

A brief introduction of the new simplified Authorization Architecture is as follows:

<p align="center">
  <img width="70%" height="70%" src="images/solution-architecture.png">
</p>

- Core:
  - Keycloak is responsible for handling the authentication with the standard OpenID Connect and manages user access with its Role Model.
  - Keycloak is configured with a new custom extension :rocket: [keycloak-openfga-event-publisher](https://github.com/embesozzi/keycloak-openfga-event-publisher) which listens to the Keycloak events (User Role Assignment, Role to Role Assignment, etc), parses this event into an OpenFGA tuple based on the [Keycloak Authz Schema](model.dsl) and publishes them to OpenFGA over HTTP.
  - OpenFGA is responsible for applying fine-grained access control. The OpenFGA service answers authorization checks by determining whether a relationship exists between an object and a user.
- Other components
  - Store Web Application is integrated with Keycloak by OpenID Connect
  - Store API is protected by OAuth 2.0 and it utilizes the OpenFGA SDK for FGA

## How does it work?

The main purpose of this SPI is to listen to the Keycloak events and publish these events to an OpenFGA solution.

Here is a high level overview of the extension:

<p align="center">
  <img width="40%" height="40%" src="images/listener.png">
</p>

In this case, the extension listens to the Admin Events related to operation in Keycloak Identity, Role and Group model. So far, the extension proceeds with the following steps:

1. Parses and enriches the default Keycloak events in the following cases:

| Keycloak Event (Friendly Name) |                Description                 |
| ------------------------------ | :----------------------------------------: |
| User Role Assignment           |    User is assigned to a Keycloak Role     |
| Role To Role Assignment        | Role is assigned to a parent Keycloak Role |
| Group To Role Assignment       |    Group is assigned to a Keycloak Role    |
| User Group Membership          |        User is assigned to a Group         |

2. Transforms the Keycloak event into an OpenFGA `ClientWriteRequest` object, thanks to the OpenFGA Java SDK.

| Keycloak Event (Friendly Name) |               OpenFGA (Tuple Key)                |
| ------------------------------ | :----------------------------------------------: |
| User Role Assignment           |   User related to the object Role as assignee    |
| Role To Role Assignment        |    Role related to the object Role as parent     |
| Group To Role Assignment       | Group related to the object Role as parent group |
| User Group Membership          |       User related to a Group as assignee        |

These are all the OpenFGA events handled by the provided [keycloak-openfga-authorization-model](model.dsl). You can edit the authorization model to handle the desired events.

3. Publishes the event to OpenFGA solution

Publishes the `ClientWriteRequest` object to the OpenFGA server over an HTTP request `fgaClient.write(request)` with the [OpenFGA SDK client](https://github.com/openfga/java-sdk).

## How to install?

Download a release (\*.jar file) that works with your Keycloak version from the [list of releases](https://github.com/embesozzi/keycloak-openfga-event-publisher/releases).
Or you can build with `bash mvn clean package`

Follow the below instructions depending on your distribution and runtime environment.

### Quarkus-based distro (Keycloak.X)

Copy the jar to the `providers` folder and execute the following command:

```shell
${kc.home.dir}/bin/kc.sh build
```

### Container image (Docker)

For Docker-based setups mount or copy the jar to

- `/opt/keycloak/providers` for Keycloak.X from version `15.1.0`

> **Warning**:
>
> With the release of Keycloak 17 the Quarkus-based distribution is now fully supported by the Keycloak team.
> Therefore, <b>I have not tested this extension in Wildfly-based distro </b> :exclamation: ️

## Module Configuration

The following properties can be set via environment variables following the Keycloak specs, thus each variable MUST use the prefix `KC_SPI_EVENTS_LISTENER_OPENFGA_EVENTS_PUBLISHER`.

- `KC_SPI_EVENTS_LISTENER_OPENFGA_EVENTS_PUBLISHER_API_URL`: The `openfgaApiUrl` is the URI of the OpenFGA Server. If this variable is empty, the extension will use the default value `http://openfga:8080` for demo purposes only.

- Optional `KC_SPI_EVENTS_LISTENER_OPENFGA_EVENTS_PUBLISHER__STORE_ID` and `KC_SPI_EVENTS_LISTENER_OPENFGA_EVENTS_PUBLISHER_AUTHORIZATION_MODEL_ID` : The `openfgaStoreId` and the `openfgaAuthorizationModelId` are the store and authorization model identifiers in the OpenFGA server. If not provided, the extension will attempt to discovery them.

You may want to check [docker-compose.yml](docker-compose.yml) as an example.

## Keycloak Configuration

### Enable OpenFGA Event Publisher extension in Keycloak

Enable the Keycloak OpenFGA Event Listener extension in Keycloak:

- Open [administration console](http://keycloak:8081)
- Choose realm
- Realm settings
- Select `Events` tab and add `openfga-events-publisher` to Event Listeners.

<img src="./images/kc-admin-events.png" width="80%" height="80%">

# Test Cases

The test cases are available in the workshop:

- Workshop: https://github.com/embesozzi/keycloak-openfga-workshop --> This new extension and simplified architecture will be described there in the future.
