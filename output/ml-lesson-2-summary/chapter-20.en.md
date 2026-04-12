# What is a Neural Network?

<img src="/ml-lesson-2-summary/assets/image-20.png" alt="image-20.png" width="709" height="321" />

A Neural Network is a computational architecture inspired by the way the human brain works, and is one of the foundations of modern machine learning.

A network is built from a stack of layers:

- **Input Layer** - receives external data (numbers, pixels, text)
- **Hidden Layers** - intermediate layers that extract embedded features and patterns
- **Output Layer** - produces the final result (classification, prediction)

Each layer consists of units called **Neurons**.
Each neuron receives values from neurons in the previous layer, performs a calculation, and passes the result to the next layer.

The connection between neurons is performed using **Weights** - these are the parameters that determine how much each input affects the result.

During learning, the model updates the weights to reduce the error between the prediction and the actual result.

The more layers in the network, the deeper it is, and the more it can represent complex patterns.

**Layers, neurons, and weights - these are the building blocks of neural computation**

