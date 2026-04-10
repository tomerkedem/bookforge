# Perceptron

<img src="../assets/image-24.png" alt="image-24.png" width="710" height="362" />

Mathematical implementation of a neuron

The perceptron is the most basic unit in a neural network. It is a simple computational model that simulates the operation of a neuron: it receives several inputs, gives each of them importance, and combines them into one decision.

In the diagram we see inputs. These are values from the data. Each input is assigned a weight, which represents how important that input is relative to others. The weights are not predetermined, but are learned from the data during training.

The neuron calculates a weighted sum of the inputs, meaning each input is multiplied by its weight, and all the results are added together. This sum serves as the basis for a decision.

Then an output is received, which is the final result.

The decision is not based on just one input, but on a combination of all of them, where each one has a different influence. This way the model learns what is more important and what is less.

The perceptron model was already presented in 1969 by Minsky and Papert, and it forms the basis for all modern neural networks.

When many perceptrons are connected together in layers, a neural network is obtained that is capable of learning much more complex patterns.
