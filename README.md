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



cada usuario que se registra tiene su propio historial y sus propias órdenes: lo que ves al iniciar sesión es solo lo que creaste con esa cuenta. El PDF de la prueba tecnica no pide roles (admin, comercios compartidos, equipo con el mismo panel, etc.), así que no hay compartición de órdenes entre cuentas y cambios de estados de una orden entre usuarios, por ejemplo maria hizo tal orden, el repartido entro con su usuarios y no vera la orden de maria porque son cuentas diferente.

Si en el futuro el producto pide varios perfiles o permisos (por ejemplo admin, varios comercios, misma organización), se puede evolucionar el modelo con roles, organizaciones o workspaces; hoy el alcance es multi‑cuenta con datos aislados por usuario autenticado, Pero como digo si se gusta cambiarlos a futuro claro que se puede hacer, gracias!!

