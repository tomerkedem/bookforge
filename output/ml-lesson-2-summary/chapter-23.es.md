# Propagación Hacia Adelante y Hacia Atrás

Para entender cómo aprende una red neuronal, necesitas conocer dos etapas principales que se repiten durante todo el proceso de entrenamiento: el paso hacia adelante y el paso hacia atrás.

En la propagación hacia adelante (Forward Propagation), los datos entran en la red a través de la capa de entrada y avanzan capa por capa hasta que se recibe una salida. En cada capa se realiza un cálculo basado en los pesos y el bias, hasta obtener una *predicción*.

En la ilustración puedes ver el flujo de izquierda a derecha hasta la etapa de predicción.

Después de eso, la predicción se compara con el valor real y, y la diferencia entre ellos se llama error.
**Para medir el error se utilizan funciones apropiadas:**

Loss mide el error para un solo ejemplo, y Cost mide el error en todos los datos.

<img src="/ml-lesson-2-summary/assets/image-23.png" alt="image-23.png" width="636" height="347" />

En la siguiente etapa, la propagación hacia atrás (Backward Propagation), el error se propaga hacia atrás a través de la red, como se muestra en la ilustración con las flechas de retorno. En cada capa se calcula cuánto contribuyó cada peso al error, y se actualiza para que el error disminuya.

Este proceso se repite una y otra vez: paso adelante → cálculo de error → paso atrás → actualización de pesos. En cada iteración la red mejora ligeramente, y aprende a producir predicciones más precisas.

De esta manera, la red no recibe respuestas correctas por adelantado, sino que aprende de los errores, y se actualiza gradualmente para maximizar la precisión con el tiempo.

**La red aprende corrigiendo errores repetidamente, y mejora sus predicciones gradualmente**

**Deep Learning**

Deep Learning es una extensión de las redes neuronales, basada en el uso de un gran número de capas de computación.

A diferencia de las redes simples, los datos pasan por muchas capas, donde cada capa aprende una representación diferente de la información. A medida que avanzamos en la red, las representaciones se vuelven más complejas y abstractas.

En la ilustración puedes ver cómo la información fluye desde la capa de entrada hasta la salida, pasando por muchas capas. En cada paso se realiza un procesamiento adicional que destaca diferentes patrones en los datos.

De esta manera, la red no solo mapea entrada a salida, sino que aprende a representar los datos en diferentes niveles de abstracción, donde cada capa agrega otro nivel de comprensión.

<img src="/ml-lesson-2-summary/assets/image-24.png" alt="image-24.png" width="646" height="283" />

Deep Learning es un subcampo del Machine Learning, por lo que no es un enfoque separado sino una extensión del mismo método, basado en redes más profundas.

**Para entrenar tales modelos se requieren tres componentes principales:**
**Una gran cantidad de datos, alto poder de cómputo, y métodos de entrenamiento avanzados.**

Esta combinación permite a los modelos aprender relaciones muy complejas, y a veces lograr un rendimiento particularmente alto en tareas como reconocimiento de imágenes, procesamiento de lenguaje natural, reconocimiento de voz y sistemas de generación basados en IA.

**La profundidad de la red es lo que permite al modelo aprender representaciones complejas**

