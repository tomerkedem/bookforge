# Aprendizaje Supervisado vs No Supervisado

La diferencia entre el aprendizaje supervisado y el no supervisado se expresa principalmente en tres aspectos clave: usos, complejidad y desventajas.

**En términos de usos**,

**El aprendizaje supervisado** es adecuado para situaciones donde existen datos etiquetados, es decir, hay una respuesta correcta conocida de antemano. En estos casos, se pueden realizar tareas como: detección de spam, análisis de sentimientos o predicción de precios.

**El aprendizaje no supervisado** funciona cuando no hay etiquetas, por lo que su objetivo no es predecir un resultado sino descubrir estructura y patrones en los datos. Se utiliza, entre otras cosas, para dividir clientes en grupos, sistemas de recomendación, detección de anomalías y análisis de datos médicos.

**En términos de complejidad**,

**El aprendizaje supervisado** se considera más simple cuando existen datos etiquetados, y puede implementarse usando herramientas comunes como Python o R.

**El aprendizaje no supervisado** generalmente requiere procesamiento más complejo, trabajar con grandes cantidades de datos y a veces mayor poder de cómputo.

**En términos de desventajas**,

**En el aprendizaje supervisado** es necesario el etiquetado manual de los datos, un proceso que requiere tiempo y experiencia.

**En el aprendizaje no supervisado**, dado que no hay una respuesta correcta para comparar, es difícil evaluar la calidad del resultado y a veces se requiere validación humana.

**En pocas palabras, el aprendizaje supervisado se enfoca en predicción, mientras que el aprendizaje no supervisado se enfoca en descubrimiento.**

En el aprendizaje no supervisado el modelo no recibe respuestas correctas de antemano, por lo que se enfoca en descubrir estructura interna en los datos.

**Tres usos principales ilustran cómo se hace esto en la práctica.**

<img src="/ml-lesson-2-summary/assets/image-17.png" alt="image-17.png" width="709" height="332" />

1. **Clustering** es un proceso de dividir datos no etiquetados en grupos basados en similitud. El modelo examina la proximidad o similitud entre puntos, y agrupa datos similares juntos. Por ejemplo, puedes dividir clientes en grupos por comportamiento, o identificar patrones repetitivos en imágenes. En algoritmos como K-Means, el número de grupos se determina de antemano, y afecta el nivel de detalle de la división.

2. **Association** se enfoca en identificar relaciones entre variables. En lugar de dividir en grupos, el modelo busca reglas que aparecen juntas. Por ejemplo, si los clientes que compran un producto tienden a comprar otro producto también, esta relación puede identificarse y usarse para recomendaciones. Esta es la base para sistemas de recomendación y análisis de canasta de compras.

3. **Dimensionality Reduction** se ocupa de reducir el número de variables en los datos. Cuando hay muchas características, es difícil analizar la información eficientemente. El modelo reduce dimensiones mientras preserva información importante. Así puedes trabajar con datos más simples, reducir ruido y mejorar el rendimiento de otros modelos.

Estos tres enfoques representan diferentes formas de descubrir estructura en los datos: dividir en grupos, descubrir relaciones y reducir complejidad.

