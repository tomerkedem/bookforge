# Puntuación F1 y Comprensión del Rendimiento del Modelo

Al evaluar un modelo de clasificación, la Accuracy (precisión general) no siempre es suficiente.

Muestra cuántas veces acertamos, pero no distingue entre tipos de errores.

Por ejemplo, si la mayoría de los días no llueve, un modelo que siempre predice "no lluvia" podría lograr alta precisión, pero en la práctica no será útil.

<img src="/ml-lesson-2-summary/assets/image-27.png" alt="image-27.png" width="474" height="256" />

Para comprender mejor el rendimiento del modelo, nos enfocamos en los casos positivos.

**Precision**

Precision mide qué tan precisas son las predicciones positivas del modelo.

Es decir:

Cuando el modelo predijo "lloverá mañana", ¿cuántas veces realmente ocurrió?

<img src="/ml-lesson-2-summary/assets/image-28.png" alt="image-28.png" width="202" height="59" />

**Recall**

Recall mide qué tan bien el modelo logra identificar todos los casos positivos.

Es decir:

De todos los días que realmente llovió, ¿cuántos identificó exitosamente el modelo?

<img src="/ml-lesson-2-summary/assets/image-29.png" alt="image-29.png" width="168" height="53" />

**El Balance Entre Ellos**

Hay un compromiso entre las dos métricas:

**Alta Precision** → cuando el modelo dice "lloverá" generalmente acierta, pero podría perderse días cuando realmente llovió

**Alto Recall** → el modelo identifica la mayoría de los días lluviosos, pero a veces se equivoca y alerta sobre lluvia incluso cuando no llovió

**Puntuación F1**

La puntuación F1 combina Precision y Recall en una métrica balanceada:

<img src="/ml-lesson-2-summary/assets/image-30.png" alt="image-30.png" width="232" height="56" />

**F1 proporciona una imagen balanceada entre la precisión de las predicciones y la capacidad de identificar todos los casos importantes**

