# Matriz de Confusión

Cuando un modelo realiza clasificación, no es suficiente saber qué tan preciso es en general. También es importante entender qué tipo de errores comete.

Una Matriz de Confusión es una tabla que desglosa las predicciones del modelo en cuatro estados, comparando la predicción con el valor real.

Digamos que estamos tratando de predecir si lloverá mañana:

<img src="/ml-lesson-2-summary/assets/image-25.png" alt="image-25.png" width="286" height="242" />

- **True Positive (TP)** - El modelo predijo lluvia, y realmente llovió
- **False Positive (FP)** - El modelo predijo lluvia, pero en realidad no llovió
- **False Negative (FN)** - El modelo predijo que no llovería, pero en realidad sí llovió
- **True Negative (TN)** - El modelo predijo que no llovería, y realmente no llovió

La tabla nos permite ver no solo qué tan preciso es el modelo, **sino también cómo comete errores.**

**Accuracy (Precisión General)**

Una de las métricas básicas es Accuracy, y aquí está la fórmula:

<img src="/ml-lesson-2-summary/assets/image-26.png" alt="image-26.png" width="306" height="74" />

Esta es la proporción entre el número de predicciones correctas (TP + TN) y el total de casos.

**Pero es importante entender:** Accuracy por sí solo no siempre es suficiente. Accuracy mide cuántas veces acertamos, pero no qué errores cometimos.

⚠️ Por qué Accuracy puede ser engañoso

Digamos que la mayoría de los días no llueve.

Un modelo que siempre predice "no lluvia" podría lograr alta precisión, pero en la práctica no es útil porque nunca identifica la lluvia.

