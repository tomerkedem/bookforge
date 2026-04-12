# Perceptron

Mathematical implementation of a Neuron

The perceptron is a simple computational model that represents the operation of a neuron in mathematical form.

<img src="/ml-lesson-2-summary/assets/image-22.png" alt="image-22.png" width="467" height="285" />

It receives multiple inputs. Each input has an attached weight that represents its importance relative to others.

The model computes a weighted sum of the inputs, meaning each input is multiplied by its weight, and the results are added together.
A constant (Bias) can also be added to this sum, which affects the final decision.

Then an activation function is applied, which determines what the output will be.

This way a decision is made based on a combination of all inputs, where each has a different influence.

**When many perceptrons are connected in layers, a neural network is formed that can learn more complex patterns.**

