Perfecto 🙌

Aquí tienes el \*\*README.md COMPLETO\*\*, listo para \*\*copiar y pegar tal cual\*\* en tu repositorio.

Está escrito para que \*\*cualquier persona (profe, cliente o dev)\*\* entienda el flujo completo y pueda ejecutar el proyecto en local sin preguntarte nada.



---



```md

\# Abogados CRM – Tus Abogados 24/7



CRM para gestión de leads y registro de llamadas con IA.  

El sistema permite visualizar métricas, administrar leads y consultar el historial completo de llamadas (Call Logs) con \*\*resumen, transcripción, análisis y audio\*\*, integrándose mediante \*\*webhooks de Retell\*\*.



---



\## 🧠 ¿Qué hace este proyecto?



\- Gestiona \*\*leads\*\* que ingresan por llamadas

\- Registra automáticamente las \*\*llamadas\*\* recibidas vía webhook

\- Muestra métricas clave en un \*\*Dashboard\*\*

\- Permite navegar desde un lead directamente al \*\*detalle de su llamada\*\*

\- Funciona completamente en \*\*local\*\* usando \*\*ngrok\*\* para recibir webhooks



---



\## 🧩 Tecnologías utilizadas



\### Frontend

\- \*\*React + TypeScript\*\*

\- \*\*Vite\*\*

\- \*\*Tailwind CSS\*\*

\- \*\*shadcn/ui\*\*

\- \*\*lucide-react\*\*

\- \*\*Recharts\*\*

\- \*\*React Router DOM\*\*



\### Backend

\- \*\*Node.js\*\*

\- \*\*Express\*\*

\- \*\*Webhooks\*\*

\- \*\*Ngrok\*\* (exponer backend local)



\### Integración

\- \*\*Retell AI\*\* (proveedor de llamadas)

\- Webhook personalizado: `/retell-webhook`



---



\## 🔁 Flujo general del sistema



\### 1️⃣ Recepción de llamadas (Backend)

1\. Retell envía eventos de llamadas al webhook

2\. Ngrok expone el backend local

3\. El backend recibe el evento en `/retell-webhook`

4\. Se guarda el Call Log con:

&nbsp;  - Teléfono

&nbsp;  - Nombre del lead

&nbsp;  - Duración

&nbsp;  - Estado

&nbsp;  - Resumen

&nbsp;  - Transcripción

&nbsp;  - Análisis

&nbsp;  - Audio (si existe)



---



\### 2️⃣ Dashboard

Ruta: `/dashboard`



Contiene:

\- Cards de métricas (Total Leads, Qualified, Converted, Avg Response)

\- Gráfica de distribución por tipo de caso

\- Tabla de leads con buscador

\- Acciones rápidas por lead



---



\### 3️⃣ Lead → Call Logs (detalle automático)

\- En la tabla de leads, cada fila tiene un botón `...`

\- Al hacer click:

```



/call-logs?phone=+573XXXXXXXXX



```

\- En Call Logs:

\- Se detecta el `phone` desde la URL

\- Se abre automáticamente el \*\*detalle de la llamada más reciente\*\*

\- Se puede cerrar el modal sin que se vuelva a abrir



---



\## 📁 Estructura del proyecto



```



Abogados-CRM/

│

├── client/          # Frontend (React + Vite)

│   ├── src/

│   └── package.json

│

├── server/          # Backend (Express)

│   ├── index.ts

│   └── routes/

│

├── .env

├── package.json

└── README.md



````



---



\## ⚙️ Requisitos previos



\- Node.js (LTS recomendado)

\- npm

\- Ngrok instalado

\- Cuenta/configuración en Retell



---



\## 🔐 Variables de entorno



Crear archivo `.env` en la raíz (o donde esté configurado el backend):



```env

PORT=5000

RETELL\_WEBHOOK\_SECRET=tu\_secreto\_aqui

````



> Agrega aquí otras variables necesarias según tu backend (DB, API keys, etc).



---



\## ▶️ Ejecutar el proyecto en local



\### 1️⃣ Instalar dependencias



Desde la raíz del proyecto:



```bash

npm install

```



Instalar frontend:



```bash

cd client

npm install

cd ..

```



---



\### 2️⃣ Levantar el backend (Express)



```bash

npm run dev

```



Salida esperada:



```

\[express] serving on http://127.0.0.1:5000

```



---



\### 3️⃣ Levantar ngrok (OBLIGATORIO para webhooks)



En otra terminal:



```bash

ngrok http 5000

```



Ngrok generará una URL pública HTTPS, por ejemplo:



```

https://abcd-12-34-56.ngrok-free.app

```



---



\### 4️⃣ Configurar webhook en Retell ✅



En el panel de \*\*Retell\*\*, configura el webhook así:



```

https://abcd-12-34-56.ngrok-free.app/retell-webhook

```



📌 Importante:



\* Cada vez que reinicias ngrok, la URL cambia

\* Debes actualizarla en Retell

\* El backend debe estar corriendo antes de probar llamadas



---



\### 5️⃣ Levantar el frontend



```bash

cd client

npm run dev

```



Frontend disponible en:



```

http://localhost:5173

```



---



\## 🧭 Rutas principales



| Ruta                   | Descripción                     |

| ---------------------- | ------------------------------- |

| `/dashboard`           | Panel principal                 |

| `/call-logs`           | Historial de llamadas           |

| `/call-logs?phone=...` | Abre automáticamente el detalle |



---



\## 🛠️ Solución de problemas



\### ❌ No llegan llamadas nuevas



\* Verifica que backend esté activo

\* Verifica que ngrok esté corriendo

\* Revisa que Retell apunte a `/retell-webhook`

\* Revisa logs del backend



---



\### ❌ El botón `...` no navega



\* Asegúrate de usar `BrowserRouter`

\* Verifica que exista la ruta `/call-logs`

\* Revisa que `react-router-dom` esté instalado en `client/`



---



\### ❌ El modal no se cierra



\* El modal se autoabre solo una vez

\* Al cerrar:



&nbsp; \* Se limpia el query param

&nbsp; \* No se vuelve a abrir



---



\## 🚀 Estado del proyecto



\* ✅ Navegación Dashboard → Call Logs

\* ✅ Webhooks funcionales en local

\* ✅ UI mejorada y consistente

\* ✅ Código versionado en GitHub



---



\## 👤 Autor



\*\*Karoll Ramírez\*\*

GitHub: \[https://github.com/karollrs](https://github.com/karollrs)

Repositorio: \*\*Abogados2\*\*



```



---



Si quieres, el siguiente paso puede ser:

\- dejar este README más \*\*académico\*\* (para entrega UNAD)

\- o más \*\*comercial\*\* (para cliente)

\- o preparar \*\*deploy productivo\*\* (sin ngrok)



Tú mandas 👌

```



