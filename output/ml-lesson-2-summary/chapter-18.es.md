# Aprendizaje Semi-supervisado

El aprendizaje semi-supervisado combina el aprendizaje supervisado y no supervisado, y permite aprender de datos donde solo una pequeña parte está etiquetada.

Este enfoque es especialmente útil cuando hay muchos datos, pero el proceso de etiquetado es costoso, complejo o requiere experiencia humana.

En lugar de depender solo de datos etiquetados, el modelo también usa datos sin etiquetas.
Los datos no etiquetados ayudan a entender la estructura general, mientras que las etiquetas sirven como ancla que guía el aprendizaje.

<img src="/ml-lesson-2-summary/assets/image-18.png" alt="image-18.png" width="710" height="301" />

En el proceso de trabajo, el modelo primero identifica patrones generales en los datos, por ejemplo usando Clustering. Luego, usa una pequeña cantidad de etiquetas para mejorar y refinar la división.

De esta manera se logra una combinación de descubrimiento de estructura y predicción más precisa.

Por ejemplo, en el análisis de imágenes médicas puedes etiquetar solo una pequeña parte de los ejemplos, y aún así mejorar significativamente el rendimiento del modelo usando los datos no etiquetados.

Esto resulta en un enfoque eficiente que aprovecha información parcial para lograr mejores resultados.

**El aprendizaje semi-supervisado balancea entre predicción y descubrimiento**

