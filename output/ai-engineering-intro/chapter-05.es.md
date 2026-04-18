# Ejemplo de Nueva Interfaz de Características - Verint AI Insights

Permiten al cliente tomar un subconjunto de llamadas, pueden ser unos cientos de llamadas que representan algún tema comercial y quieren entender insights relacionados con él.

Por ejemplo: si tienen un caso de abandono de clientes y quieren hacer **Retención** (el término en servicio al cliente se refiere a la capacidad de un negocio **de mantener clientes existentes a lo largo del tiempo**, en lugar de perderlos ante la competencia).

Entonces pueden hablar con el bot y decirle que les dé guiones que ayuden a retener clientes, así que toma todas las llamadas y trae los insights de las llamadas, todos los insights se basan en llamadas reales.

<img src="/ai-engineering-intro/assets/image-03.png" alt="image-03.png" width="538" height="275" />

Hasta hoy tenían que escuchar todas las llamadas lo que les tomaba mucho tiempo, hoy se hace en segundos automáticamente y los clientes están muy satisfechos y realmente les encanta.

Dentro de un sistema de gestión de centros de llamadas. Esta es una aplicación clásica de **GenAI** sirviendo como "entrenador" para gerentes o agentes.


**Consulta del Usuario:** "¿Puedes sugerir un guión que ayude con la retención de clientes?"

**Respuesta de la IA:**

"Basándose en interacciones (llamadas) donde se realizó una retención exitosa, se recomienda capacitar a los empleados para enfatizar el valor y la singularidad de las ofertas:"

Ejemplos:

Exclusividad del Plan:

Cita de llamada (19 de septiembre): "Estás en un plan exclusivo."

Tranquilidad:

Cita de llamada (17 de septiembre): "Siempre estamos aquí cuando nos necesitas."



**¿Qué está pasando aquí a nivel técnico?**

Para lograr este resultado, el sistema realiza varias operaciones complejas detrás de escenas:

• **RAG (Retrieval-Augmented Generation):**

La IA no simplemente inventa una respuesta genérica. Accede a la base de datos de llamadas transcritas, busca llamadas marcadas como "retención exitosa" y extrae de ellas las oraciones que funcionaron mejor.

• **Búsqueda Semántica:**

El sistema entiende el contexto de "retención" y busca oraciones con significado similar (como exclusividad o calidad del servicio).

• **Insights Accionables:** 

Este es un insight sobre el que puedes actuar. En lugar de solo decir "la retención mejoró", el sistema le dice al gerente del centro de llamadas exactamente qué decirle a los agentes en la próxima capacitación.


**¿Por qué es esto crítico en sistemas de IA?**

En el ejemplo presentado, la IA no solo dijo "la retención de clientes es importante". Realizó un **Insight Accionable** al:

1. Analizar qué funcionó en llamadas exitosas.

2. Destilarlo en oraciones específicas ("Estás en un plan exclusivo").

3. Dar orientación al gerente: "Se recomienda capacitar a los empleados para usar estas oraciones."

**Componentes de un Insight Accionable:**

• **Contexto:** ¿Por qué está sucediendo esto?

• **Relevancia:** ¿Es esto importante para el negocio ahora?

• **Recomendación para la Acción:** ¿Cuál es el siguiente paso?

Cuando construyes una característica así, el objetivo es que el usuario final (gerente del centro de llamadas) no necesite "romperse la cabeza" sobre qué hacer con los gráficos. El sistema debe servirle la solución en bandeja de plata.
