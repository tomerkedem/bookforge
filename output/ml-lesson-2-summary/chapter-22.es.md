# Perceptrón

Implementación matemática de una Neurona

El perceptrón es un modelo computacional simple que representa la operación de una neurona en forma matemática.

<img src="/ml-lesson-2-summary/assets/image-22.png" alt="image-22.png" width="467" height="285" />

Recibe múltiples entradas. Cada entrada tiene un peso adjunto que representa su importancia relativa a las otras.

El modelo calcula una suma ponderada de las entradas, es decir, cada entrada se multiplica por su peso, y los resultados se suman.
También se puede agregar una constante (Bias) a esta suma, que afecta la decisión final.

Luego se aplica una función de activación, que determina cuál será la salida.

De esta manera se toma una decisión basada en una combinación de todas las entradas, donde cada una tiene una influencia diferente.

**Cuando muchos perceptrones se conectan en capas, se forma una red neuronal que puede aprender patrones más complejos.**

