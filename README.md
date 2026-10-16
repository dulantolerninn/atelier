# Board Archive

Espacio privado en la nube con herramientas para pensar y crear. La primera herramienta son las **Pizarras**: pizarras infinitas organizadas por proyecto.

## Estructura

| Ruta | Pantalla |
| --- | --- |
| `/` | Inicio: herramientas y acceso a la última pizarra abierta |
| `/pizarras` | Proyectos |
| `/pizarras/[proyecto]` | Pizarras de un proyecto |
| `/pizarras/[proyecto]/[pizarra]` | Lienzo |

- `src/lib/brand.ts`: nombre y textos de marca (único lugar donde vive el nombre de la app).
- `src/lib/tools.ts`: registro de herramientas. Para añadir una nueva, agrégala ahí y crea su ruta bajo `src/app/(app)/`.
- `src/lib/data.ts`: acceso a Supabase. `src/lib/scene.ts`: serialización de las pizarras.

## Configuración inicial

1. En Supabase, abre **SQL Editor** y pulsa **New query**.
2. Copia todo el contenido de `supabase/migrations/202608080001_initial_schema.sql`, pégalo y pulsa **Run**.
3. En **Authentication → Providers → Email**, confirma que Email está activado. El acceso es con correo y contraseña de un usuario creado en **Authentication → Users**.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Las variables necesarias (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) están en `.env.local`, que no se sube al repositorio.

Otros comandos: `npm test` (pruebas), `npm run lint`, `npm run build`.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. En **Settings → Environment Variables**, añade las dos variables anteriores.
3. Cada push a `main` se despliega a producción.

Nunca añadas una clave `service_role` al navegador ni a Vercel para esta aplicación.
