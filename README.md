# Boxful API

1) Descargá el proyecto (git clone o ZIP) y entrá a la carpeta.

2) `npm install` , Recuerda tener la ultima version estable de node js para la instalacion

3) Creá el archivo `.env` en la raíz y pegá esto

NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://william:william123@williamcluster.evu7i.mongodb.net/boxful?retryWrites=true&w=majority&appName=williamcluster
JWT_SECRET=dev-only-secret-min-16-characters-required
JWT_EXPIRES_IN=7d

(Ojo nunca andes poniendo credenciales en readme o los suban a github, Yo lo estoy subiendo porque es una prueba tecnica y para que pueda instalar y ejecutar rapido el backend, Pero no pongan credenciales vale!!)

el backend correra en el puerto 3001, Para que no hay interferencia con el frontend que corre en 3000


4) `npm run start:dev` → listo. ya puede ejecutar el proyecto

