# Frontend Angular - Funcion Editar/Actualizar

Frontend en **Angular 18 (componentes standalone) + HttpClient** que implementa la
funcion **Editar/Actualizar** dentro del proyecto unificado.

Todo el proyecto corre en **un solo servidor (puerto 3001)** que sirve la API y los
4 frontends compilados, cada uno bajo una ruta. Este Angular se sirve bajo **/editar**.

## Que hace
- Lista las consultas existentes (GET) para elegir cual editar.
- Al pulsar "Editar" carga los datos en un formulario y guarda los cambios con **PUT**.
- No crea ni elimina (esas son otras funciones/otros frameworks).

## Estructura
- `ConsultaService`: centraliza las llamadas HTTP que usa esta función (listar, actualizar).
  Base relativa: `/api/consultas` (mismo origen/puerto que el servidor unificado).
- `ConsultaListComponent`: listado + formulario de edicion.
- `ConsultaDetailComponent`: detalle de la consulta seleccionada.
- Barra de navegacion comun con enlaces a las 4 funciones:
  Registrar (/registrar), Editar (/editar), Filtrar (/filtrar), Estado (/estado).

## Configuracion clave
- `angular.json` -> `baseHref: "/editar/"` para que los assets carguen bajo /editar.

## Como se sirve
La app compilada se publica en el servidor unificado y se accede en:
`http://localhost:3001/editar`
