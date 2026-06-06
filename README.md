# IncidenciUS

Este repositorio contiene IncidenciUS, una aplicación web descentralizada para la gestión de incidencias. La aplicación no depende de un servidor central, sino que se apoya en contratos inteligentes desplegados en una red Ethereum y en IPFS para almacenar la información sensible de forma cifrada. En la blockchain solo se guardan los hashes, los CID que apuntan a IPFS y las claves cifradas, mientras que los datos en claro nunca llegan a exponerse.

El objetivo de este documento es explicar cómo desplegar el sistema desde cero y cómo utilizarlo una vez está en funcionamiento, ya que el despliegue puede resultar algo lioso la primera vez. El documento está escrito primero en español y, más abajo, se repite en inglés.

## Tecnologías utilizadas

El sistema se compone de dos partes que funcionan de manera conjunta. Por un lado están los contratos inteligentes, programados en Solidity (versión 0.8.28) y desplegados con Hardhat y su utilidad Hardhat Ignition. Por otro lado está el frontend, desarrollado con React (concretamente con Create React App), que es el encargado de comunicar al usuario con el resto del sistema. El frontend se comunica con los contratos mediante la librería ethers.js y con IPFS a través del servicio Pinata. Para el cifrado de la información se utilizan las librerías crypto-js y eth-crypto. Además, es necesario tener instalada la billetera MetaMask, ya que es la que permite firmar las transacciones y la que actúa como identidad del usuario.

Los contratos se pueden desplegar tanto en una red local de prueba (la que ofrece el propio Hardhat) como en la red de pruebas Sepolia de Ethereum. Para desarrollar y para probar, lo más cómodo es usar la red local, ya que es gratuita y no requiere conseguir ETH de prueba.

## Estructura del proyecto

El proyecto está dividido en dos zonas. En la raíz se encuentra todo lo relacionado con los contratos: la carpeta de contratos con los ficheros Users.sol, UserGroups.sol, Incidences.sol, Reports.sol y AdminRequests.sol, el fichero Contracts.js (dentro de ignition/modules), que es el que permite desplegarlos, y el fichero hardhat.config.js, donde se indica en qué redes se va a desplegar. La estructura exacta de carpetas puede variar un poco según cómo tengas organizado tu repositorio, así que conviene revisarla antes de ejecutar los comandos.

La otra zona es la carpeta my-app, que contiene el frontend de React. Dentro, en src/components, los componentes están agrupados según su función: los de autenticación y perfil (login, registro, notificaciones y perfil de usuario), los de grupos (crear grupo, gestionar grupo y unirse a un grupo), los de incidencias (registrar incidencia y las dos vistas para listarlas, por usuario y por grupo) y los de reportes y administración. Aparte está la carpeta src/services, donde se encuentra web3service.js, que es el fichero más importante de todo el frontend, ya que contiene las ABI de los contratos, sus direcciones, la configuración de IPFS y toda la lógica de cifrado.

## 1. Programas necesarios antes de empezar

Antes de desplegar nada, hace falta tener instaladas algunas herramientas. Si no estás seguro de si ya las tienes, casi todas se pueden comprobar escribiendo un comando en la terminal.

Lo primero es Node.js, que se descarga desde su página oficial (https://nodejs.org) eligiendo la versión LTS, que es la recomendada (vale la versión 18 o superior). Conviene aclarar que npm no se descarga por separado, sino que se instala automáticamente junto con Node.js, así que con instalar Node.js ya tienes los dos. En Windows y en macOS basta con descargar el instalador y seguir los pasos. En Linux (Ubuntu o Debian) se podría instalar con:

    sudo apt update
    sudo apt install -y nodejs npm

Aunque no se ha comprobado, ya que el desarrollo se ha hecho íntegro en Windows 11.

Para comprobar que se ha instalado correctamente, los siguientes comandos deben devolver un número de versión:

    node -v
    npm -v

También hace falta Git para poder clonar el repositorio, que se descarga desde https://git-scm.com/downloads. Se puede comprobar con el comando `git --version`.

Después es necesario instalar MetaMask, que es una extensión de navegador que funciona como tu billetera y como tu identidad dentro de la aplicación. Se instala desde https://metamask.io/download en Chrome, Firefox o Brave, y una vez instalada hay que crear o importar una cuenta.

Por último, para la parte de IPFS hace falta una cuenta en Pinata (https://pinata.cloud). El plan gratuito es suficiente para desarrollar y probar. Pinata es el servicio que da acceso a IPFS y el que proporciona la clave (un JWT) que necesita la aplicación para subir y descargar archivos.

De manera opcional, y solo en caso de querer desplegar en la red de pruebas Sepolia en lugar de en la red local, hará falta también una cuenta en Alchemy (https://www.alchemy.com), que proporciona una URL para conectarse a un nodo de Sepolia, y conseguir algo de ETH de prueba mediante un faucet (por ejemplo el de Google Cloud para Sepolia, que regala una pequeña cantidad cada 24 horas sin coste).

## 2. Descargar el proyecto e instalar las dependencias

Una vez instaladas las herramientas anteriores, hay que descargar el proyecto e instalar sus dependencias. Esto se hace dos veces, ya que el proyecto de contratos y el frontend tienen sus propias dependencias por separado. Los comandos son los siguientes:

    git clone https://github.com/LuisRHR/IncidenciUS
    cd https://github.com/LuisRHR/IncidenciUS

    npm ci

    cd ./frontend/my-app/
    npm ci

El primer `npm ci` instala lo necesario para los contratos (Hardhat y sus utilidades), y el segundo, dentro de my-app, instala lo necesario para el frontend (React, ethers.js, etc.). En caso de que `npm ci` no funcione por la versión de node, usa `npm install`

## 3. Desplegar los contratos

Para desplegar los contratos hay dos alternativas. La primera es usar la red local de Hardhat, que es la recomendada para desarrollo y pruebas porque es gratuita e instantánea y no requiere ETH de prueba. La segunda es desplegar en la red de pruebas Sepolia, que es más parecida a un entorno real pero requiere algo más de configuración.

Para la opción local, lo primero es compilar los contratos:

    npx hardhat compile

A continuación se arranca un nodo local. Conviene dejar esta terminal abierta, ya que el nodo debe seguir funcionando mientras se usa la aplicación. Al arrancar, imprime una lista de 20 cuentas de prueba junto con sus claves privadas:

    npx hardhat node

Después, en una terminal distinta, se despliegan los contratos sobre ese nodo local:

    npx hardhat ignition deploy ./ignition/modules/Contracts.js --network localhost

Cuando termina, en la salida aparecen las direcciones de cada contrato (Users, Groups, Incidences, Reports y AdminRequests). Es importante anotarlas, porque luego hay que ponerlas en el frontend. También quedan guardadas dentro de la carpeta ignition/deployments. Por último, hay que configurar MetaMask para que use esta red local: se añade manualmente una red nueva con la URL http://127.0.0.1:8545, el Chain ID 31337 y el símbolo ETH, y se importa en MetaMask la primera de las cuentas que imprimió el comando del nodo (la cuenta número 0), usando su clave privada. Conviene tener en cuenta que esa misma cuenta es la que despliega los contratos y, al ser el primer usuario que se registre en el sistema, obtiene automáticamente el rol de administrador del sistema. Se pueden importar más cuentas para hacer las pruebas requeridas, eligiendo cualquier otra de las 20 cuentas que se imprimen al ejecutar npx hardhat node.

Para la opción de Sepolia, en lugar de un nodo local, hay que crear un fichero llamado .env en la raíz del proyecto, junto a hardhat.config.js, con dos datos: la URL de Alchemy y la clave privada de la cuenta que va a pagar el despliegue (obtenible en los detalles de la cuenta en Metamask).

    ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/TU_API_KEY
    PRIVATE_KEY=la_clave_privada_de_tu_cuenta_de_metamask_sin_0x_prefijo

Es muy importante no subir nunca este fichero .env a GitHub ni compartir la clave privada con nadie, así que conviene asegurarse de que está incluido en el .gitignore. Una vez creado el fichero, hay que conseguir algo de ETH de prueba para esa cuenta mediante un faucet de Sepolia, y luego desplegar:

    npx hardhat compile
    npx hardhat ignition deploy ./ignition/modules/Contracts.js --network sepolia

Igual que en el caso anterior, hay que anotar las direcciones que se obtienen y seleccionar la red Sepolia en MetaMask. En caso de desplegar en Sepolia, las cuentas son creadas por el usuario y deben de obtenerse créditos en ambas si se quiere usar más de una.

## 4. Configurar IPFS con Pinata

El frontend necesita cuatro datos de Pinata para poder subir y descargar la información. El primero es el JWT, que es la clave de acceso a la API de Pinata. El segundo es el gateway, que es la dirección que se usa para descargar los archivos a partir de su CID, y suele tener una forma parecida a https://TU-GATEWAY.mypinata.cloud/ipfs/, pero para el desarrollo de la aplicación se ha usado https://gateway.pinata.cloud/ipfs/, que funciona igual y mejora la descentralización de los datos. Los otros dos son las direcciones a las que se suben los datos: una para subir datos en formato JSON (https://api.pinata.cloud/pinning/pinJSONToIPFS) y otra para subir ficheros como las imágenes de las pruebas de los reportes (https://api.pinata.cloud/pinning/pinFileToIPFS).

Para conseguir el JWT hay que entrar en Pinata, ir al apartado de API Keys y crear una clave nueva con permisos de subida. En concreto, dentro de LEGACY ENDPOINTS, en el apartado Pinning, hay que marcar pinFileToIPFS y pinJSONToIPFS, y dentro de LEGACY ENDPOINTS, en el apartado Data, hay que marcar pinList. Cuando esté creada la clave, hay que copiar el JWT que se genera. El gateway se obtiene en el apartado de Gateways en caso de querer usar ese gateway (esta alternativa no se ha probado). Todos estos valores se colocan después en el fichero .env del frontend, tal y como se explica en el siguiente apartado.

## 5. Configurar y arrancar el frontend

Antes de arrancar el frontend hay que crear un fichero .env dentro de la carpeta my-app con las direcciones de los contratos que se anotaron al desplegar y con los datos de IPFS del apartado anterior. El contenido sería algo así:

    REACT_APP_USERS_CONTRACT=0x...
    REACT_APP_GROUPS_CONTRACT=0x...
    REACT_APP_INCIDENCES_CONTRACT=0x...
    REACT_APP_REPORTS_CONTRACT=0x...
    REACT_APP_ADMIN_REQUESTS_CONTRACT=0x...

    REACT_APP_IPFS_GATEWAY=https://TU-GATEWAY.mypinata.cloud/ipfs/
    o
    REACT_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
    REACT_APP_IPFS_UPLOAD_URL=https://api.pinata.cloud/pinning/pinJSONToIPFS
    REACT_APP_IPFS_FILE_UPLOAD_URL=https://api.pinata.cloud/pinning/pinFileToIPFS
    REACT_APP_PINATA_JWT=tu_token_jwt_de_pinata

Hay que tener en cuenta una particularidad de Create React App, y es que todas las variables del .env tienen que empezar obligatoriamente por REACT_APP_, ya que si no, la aplicación no las reconoce. Conviene también comprobar que los nombres de estas variables coinciden exactamente con los que se leen dentro de web3service.js. Al igual que el .env de los contratos, este fichero tampoco se sube al repositorio.

Una vez creado el fichero, se arranca la aplicación:

    cd ../frontend/my-app/
    npm start

La aplicación se abre en el navegador en la dirección http://localhost:3000. Si en algún momento se modifica el .env, hay que detener la aplicación (con Ctrl + C) y volver a ejecutar npm start para que vuelva a leer los valores.

## 6. Cómo se usa la aplicación

Para usar la aplicación es necesario tener MetaMask instalado y la red correcta seleccionada (la red local con Chain ID 31337 o, en su caso, Sepolia). Hay que tener presente que cada acción que guarda algo en la blockchain pide firmar una transacción en MetaMask.

Lo primero es conectarse. Al pulsar el botón de conectar MetaMask y autorizar la conexión, la aplicación pide firmar un mensaje de acceso. Esta firma es la que genera las claves de cifrado de la sesión y no tiene ningún coste. Si la billetera ya está registrada, se entra directamente al panel. Si no lo está, la aplicación lleva al registro.

En el registro se introduce un nombre de usuario y un correo electrónico. Al confirmar, los datos se cifran, se suben a IPFS y la referencia queda guardada en la blockchain. Como se ha comentado antes, el primer usuario que se registra en todo el sistema se convierte automáticamente en administrador del sistema.

En el apartado de perfil se puede ver la billetera y el rol del usuario. También está la opción de borrar el perfil, que elimina los datos de la blockchain de forma permanente, por lo que es una acción irreversible.

En cuanto a los grupos, un usuario puede crear un grupo, y al hacerlo se convierte en administrador de ese grupo y se genera una clave de grupo para cifrar las incidencias compartidas. Para unirse a un grupo es necesario haber sido invitado previamente. Basta con introducir el nombre del grupo para validar la invitación. El administrador del grupo dispone además de una vista de gestión donde puede invitar a nuevos miembros por su nombre de usuario, expulsar a miembros o eliminar el grupo entero.

Para registrar una incidencia se rellena el título, la descripción, la prioridad (baja, media o alta) y la fecha, que no puede ser una fecha futura. Hay que elegir si el destinatario es un usuario concreto o un grupo. Después, en la vista de incidencias, se pueden consultar las incidencias propias o las del grupo, con la posibilidad de filtrarlas por un rango de fechas. Las incidencias que están activas o reabiertas se pueden marcar como resueltas.

Las notificaciones avisan, por ejemplo, cuando a un usuario lo invitan a un grupo, o cuando una incidencia que él había enviado se marca como resuelta, de manera que pueda decidir si cerrarla o reabrirla.

Por último está la parte de reportes y administración. Cualquier usuario puede enviar un reporte de un bug del sistema o un reporte sobre otro usuario, adjuntando opcionalmente imágenes como prueba. Ese contenido se cifra para que solo lo puedan leer los administradores. También puede solicitar el rol de administrador del sistema indicando un motivo. Los administradores del sistema, por su parte, disponen de un panel desde el que pueden ver los reportes y bloquear a los usuarios denunciados, así como ver las solicitudes de administrador y aceptarlas o rechazarlas.

## 7. Si algo no funciona

Si la aplicación dice que no detecta MetaMask, normalmente es porque la extensión no está instalada o activada. Basta con instalarla o activarla y recargar la página. Si las transacciones fallan estando en la red local, conviene comprobar que la terminal con `npx hardhat node` sigue abierta y que MetaMask está usando el Chain ID 31337. Si se ha cambiado algo en el .env y no parece tener efecto, hay que reiniciar la aplicación con npm start. Si no se ven las imágenes o los datos que vienen de IPFS, lo más probable es que el JWT de Pinata o la dirección del gateway estén mal. Y si no aparecen las opciones de administrador, hay que recordar que ese rol solo lo tiene el primer usuario registrado o alguien a quien hayan ascendido.

## 8. Importar la cuenta en MetaMask y limpiarla al terminar

Este apartado da un poco más de detalle sobre la parte de MetaMask cuando se trabaja con la red local, y sobre cómo dejarlo todo limpio una vez se terminan las pruebas.

Para importar una de las cuentas de prueba, con el nodo en marcha (es decir, con npx hardhat node abierto), se copia una de las claves privadas que aparecen en la terminal. Después se abre MetaMask, se pulsa en el icono de la cuenta (arriba a la derecha), se elige la opción de importar cuenta, se pega la clave privada copiada y se confirma. Para que MetaMask se comunique con la red local, se añade una red personalizada con el nombre que se quiera (por ejemplo Hardhat), la URL http://127.0.0.1:8545, el Chain ID 31337 y el símbolo ETH, y luego se selecciona esa red. Si todo está bien, la cuenta importada aparecerá con ETH de sobra para hacer las pruebas.

Conviene tener presente que estas claves privadas son únicamente para el desarrollo en local y no deben usarse nunca en redes reales (ni en mainnet ni en testnets), ya que son públicas y cualquiera las conoce.

---

# IncidenciUS (English version)

This repository contains IncidenciUS, a decentralized web application for incident management. The application does not rely on a central server. Instead it uses smart contracts deployed on an Ethereum network and IPFS to store sensitive information in encrypted form. The blockchain only keeps hashes, the CID values pointing to IPFS, and the encrypted keys, while the plain data is never exposed.

The purpose of this document is to explain how to deploy the system from scratch and how to use it once it is running, since the deployment can be a bit confusing the first time. The document is written first in Spanish (above) and then repeated here in English.

## Technologies used

The system has two parts that work together. On one side are the smart contracts, written in Solidity (version 0.8.28) and deployed with Hardhat and its Hardhat Ignition tool. On the other side is the frontend, built with React (specifically Create React App), which connects the user to the rest of the system. The frontend talks to the contracts through the ethers.js library and to IPFS through the Pinata service. Encryption is handled with the crypto-js and eth-crypto libraries. You also need the MetaMask wallet installed, since it is what signs transactions and acts as the user's identity.

The contracts can be deployed either on a local test network (the one provided by Hardhat itself) or on Ethereum's Sepolia test network. For development and testing, the most convenient option is the local network, because it is free and does not require obtaining test ETH.

## Project structure

The project is split into two areas. The root contains everything related to the contracts: the contracts folder with the files Users.sol, UserGroups.sol, Incidences.sol, Reports.sol and AdminRequests.sol, the Contracts.js file (inside ignition/modules), which is the one used to deploy them, and the hardhat.config.js file, where the deployment networks are defined. The exact folder layout may vary depending on how your repository is organized, so it is worth checking before running the commands.

The other area is the my-app folder, which holds the React frontend. Inside, in src/components, the components are grouped by purpose: authentication and profile (login, registration, notifications and user profile), groups (create group, manage group and join a group), incidents (register an incident and the two views to list them, by user and by group), and reports and administration. Separately, in src/services, there is web3service.js, which is the most important file of the whole frontend, because it contains the contract ABIs, their addresses, the IPFS configuration and all the encryption logic.

## 1. Programs you need before starting

Before deploying anything, you need a few tools installed. If you are not sure whether you already have them, most can be checked by typing a command in the terminal.

The first one is Node.js, downloaded from its official page (https://nodejs.org), choosing the LTS version, which is the recommended one (version 18 or higher works). It is worth clarifying that npm is not downloaded separately. It is installed automatically together with Node.js, so installing Node.js gives you both. On Windows and macOS you just download the installer and follow the steps. On Linux (Ubuntu or Debian) you can install it with:

    sudo apt update
    sudo apt install -y nodejs npm

This has not been tested, though, since the whole development was done on Windows 11.

To check it installed correctly, the following commands should return a version number:

    node -v
    npm -v

You also need Git to clone the repository, downloaded from https://git-scm.com/downloads. You can check it with `git --version`.

Next you need MetaMask, a browser extension that works as your wallet and your identity inside the application. It is installed from https://metamask.io/download on Chrome, Firefox or Brave, and once installed you create or import an account.

Finally, for the IPFS part you need a Pinata account (https://pinata.cloud). The free plan is enough for development and testing. Pinata is the service that gives access to IPFS and provides the key (a JWT) the application needs to upload and download files.

Optionally, and only if you want to deploy to the Sepolia test network instead of the local one, you will also need an Alchemy account (https://www.alchemy.com), which provides a URL to connect to a Sepolia node, and some test ETH from a faucet (for example Google Cloud's Sepolia faucet, which gives a small amount every 24 hours for free).

## 2. Download the project and install dependencies

Once the tools above are installed, you download the project and install its dependencies. This is done twice, since the contract project and the frontend have their own separate dependencies. The commands are:

    git clone https://github.com/LuisRHR/IncidenciUS
    cd https://github.com/LuisRHR/IncidenciUS

    npm ci

    cd ./frontend/my-app/
    npm ci

The first `npm ci` installs what is needed for the contracts (Hardhat and its tools), and the second one, inside my-app, installs what is needed for the frontend (React, ethers.js, etc.). In case that `npm ci` does not work for the version of node you have to use `npm install`.

## 3. Deploy the contracts

There are two options to deploy the contracts. The first is to use the local Hardhat network, which is recommended for development and testing because it is free, instant and does not require test ETH. The second is to deploy to the Sepolia test network, which is closer to a real environment but needs a bit more configuration.

For the local option, first compile the contracts:

    npx hardhat compile

Then start a local node. It is best to leave this terminal open, since the node must keep running while the application is used. When it starts, it prints a list of 20 test accounts along with their private keys:

    npx hardhat node

After that, in a different terminal, deploy the contracts onto that local node:

    npx hardhat ignition deploy ./ignition/modules/Contracts.js --network localhost

When it finishes, the output shows the address of each contract (Users, Groups, Incidences, Reports and AdminRequests). It is important to write them down, because they need to be set in the frontend later. They are also saved inside the ignition/deployments folder. Finally, you have to configure MetaMask to use this local network: add a new network manually with the URL http://127.0.0.1:8545, Chain ID 31337 and symbol ETH, and import into MetaMask the first of the accounts printed by the node command (account number 0), using its private key. Keep in mind that this same account is the one that deploys the contracts and, as the first user to register in the system, automatically becomes the system administrator. You can import more accounts to run the tests you need, choosing any of the other 20 accounts printed when running npx hardhat node.

For the Sepolia option, instead of a local node, you have to create a file called .env in the project root, next to hardhat.config.js, with two values: the Alchemy URL and the private key of the account that will pay for the deployment (get it from the details of the account in Metamask).

    ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
    PRIVATE_KEY=your_metamask_account_private_key

It is very important never to upload this .env file to GitHub or share the private key with anyone, so make sure it is included in the .gitignore. Once the file is created, get some test ETH for that account from a Sepolia faucet, and then deploy:

    npx hardhat compile
    npx hardhat ignition deploy ./ignition/modules/Contracts.js --network sepolia

As before, write down the addresses you get and select the Sepolia network in MetaMask. If you deploy on Sepolia, the accounts are created by the user, and you need to obtain test ETH for each of them if you want to use more than one.

## 4. Configure IPFS with Pinata

The frontend needs four values from Pinata to upload and download information. The first is the JWT, which is the access key for the Pinata API. The second is the gateway, which is the address used to download files from their CID, usually looking something like https://YOUR-GATEWAY.mypinata.cloud/ipfs/, although for developing the application https://gateway.pinata.cloud/ipfs/ was used, which works the same and improves the decentralization of the data. The other two are the addresses where data is uploaded: one for uploading JSON data (https://api.pinata.cloud/pinning/pinJSONToIPFS) and another for uploading files such as the proof images of the reports (https://api.pinata.cloud/pinning/pinFileToIPFS).

To get the JWT, go to Pinata, open the API Keys section and create a new key with upload permissions. In particular, under LEGACY ENDPOINTS, in the Pinning section, tick pinFileToIPFS and pinJSONToIPFS, and under LEGACY ENDPOINTS, in the Data section, tick pinList. Once the key is created, copy the JWT that is generated. The gateway is found in the Gateways section (this alternative was not tested). All these values are then placed in the frontend .env file, as explained in the next section.

## 5. Configure and run the frontend

Before running the frontend you have to create a .env file inside the my-app folder with the contract addresses you wrote down during deployment and with the IPFS values from the previous section. The content would look like this:

    REACT_APP_USERS_CONTRACT=0x...
    REACT_APP_GROUPS_CONTRACT=0x...
    REACT_APP_INCIDENCES_CONTRACT=0x...
    REACT_APP_REPORTS_CONTRACT=0x...
    REACT_APP_ADMIN_REQUESTS_CONTRACT=0x...

    REACT_APP_IPFS_GATEWAY=https://TU-GATEWAY.mypinata.cloud/ipfs/
    o
    REACT_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
    REACT_APP_IPFS_UPLOAD_URL=https://api.pinata.cloud/pinning/pinJSONToIPFS
    REACT_APP_IPFS_FILE_UPLOAD_URL=https://api.pinata.cloud/pinning/pinFileToIPFS
    REACT_APP_PINATA_JWT=your_pinata_jwt_token

There is a particularity of Create React App to keep in mind, and it is that every variable in the .env must start with REACT_APP_, otherwise the application will not recognize it. It is also worth checking that the names of these variables match exactly the ones read inside web3service.js. Like the contracts .env, this file is not uploaded to the repository either.

Once the file is created, start the application:

    cd ./frontend/my-app/
    npm start

The application opens in the browser at http://localhost:3000. If at some point you change the .env, you have to stop the application (with Ctrl + C) and run npm start again so it reads the values once more.

## 6. How to use the application

To use the application you need MetaMask installed and the correct network selected (the local network with Chain ID 31337 or, where applicable, Sepolia). Keep in mind that every action that stores something on the blockchain asks you to sign a transaction in MetaMask.

The first thing is to connect. When you press the connect MetaMask button and approve the connection, the application asks you to sign an access message. This signature is what generates the session encryption keys and has no cost. If the wallet is already registered, you go straight to the dashboard. If it is not, the application takes you to registration.

In registration you enter a username and an email. When you confirm, the data is encrypted, uploaded to IPFS and the reference is stored on the blockchain. As mentioned earlier, the first user to register in the whole system automatically becomes the system administrator.

In the profile section you can see the wallet and the role of the user. There is also an option to delete the profile, which removes the data from the blockchain permanently, so it is an irreversible action.

As for groups, a user can create a group, and by doing so becomes the administrator of that group, and a group key is generated to encrypt the shared incidents. To join a group you must have been invited beforehand. You just enter the group name to validate the invitation. The group administrator also has a management view where they can invite new members by their username, remove members or delete the whole group.

To register an incident you fill in the title, the description, the priority (low, medium or high) and the date, which cannot be a future date. You choose whether the recipient is a specific user or a group. Then, in the incidents view, you can look at your own incidents or those of the group, with the option to filter them by a date range. Incidents that are active or reopened can be marked as resolved.

Notifications warn you, for example, when you are invited to a group, or when an incident you had sent is marked as resolved, so that you can decide whether to close it or reopen it.

Finally there is the reports and administration part. Any user can send a report about a system bug or a report about another user, optionally attaching images as proof. That content is encrypted so that only administrators can read it. A user can also request the system administrator role by stating a reason. System administrators, in turn, have a panel where they can see the reports and block reported users, as well as see the administrator requests and accept or reject them.

## 7. If something does not work

If the application says it cannot detect MetaMask, it is usually because the extension is not installed or enabled. Just install or enable it and reload the page. If transactions fail while on the local network, check that the terminal with `npx hardhat node` is still open and that MetaMask is using Chain ID 31337. If you changed something in the .env and it does not seem to take effect, restart the application with npm start. If you cannot see the images or data coming from IPFS, the most likely cause is that the Pinata JWT or the gateway address are wrong. And if the administrator options do not appear, remember that this role only belongs to the first registered user or to someone who has been promoted.

## 8. Importing the account in MetaMask and cleaning it up afterwards

This section gives a little more detail about the MetaMask part when working with the local network, and about how to leave everything clean once the tests are finished.

To import one of the test accounts, with the node running (that is, with npx hardhat node open), copy one of the private keys shown in the terminal. Then open MetaMask, click on the account icon (top right), choose the import account option, paste the copied private key and confirm. For MetaMask to communicate with the local network, add a custom network with whatever name you want (for example Hardhat), the URL http://127.0.0.1:8545, Chain ID 31337 and symbol ETH, and then select that network. If everything is fine, the imported account will show up with plenty of ETH for testing.

Keep in mind that these private keys are only for local development and must never be used on real networks (neither mainnet nor testnets), since they are public and anyone knows them.
