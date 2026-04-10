# Neural Networks

<img src="../assets/image-22.png" alt="image-22.png" width="441" height="215" />

A neural network is a model composed of layers of small computing units, which are connected to each other and transfer information between them.

In the diagram one can see a typical network structure:

On the left side is the input layer, in the center are hidden layers, and on the right side is the output layer.

Each circle represents a "neuron", meaning a unit that receives values, performs a calculation, and passes the result forward. The lines between the neurons represent connections with weights, which determine how much each input influences the result.

Information flows from left to right. At each layer, additional processing of the data is performed, so the network gradually learns more complex representations. Initially it's about simple connections, and later about more complex patterns.

The learning process is performed by adjusting the weights. When the model makes a mistake, it updates the weights so that next time the result will be more accurate.

This way a neural network succeeds in learning complex relationships in data, even when they cannot be manually defined in advance.
