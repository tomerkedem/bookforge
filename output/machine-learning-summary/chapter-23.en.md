# Forward and Backward Propagation

<img src="../assets/image-25.png" alt="image-25.png" width="709" height="329" />

To understand how a neural network learns, you need to understand two stages that repeat themselves all the time: forward pass and backward pass.

In Forward Propagation

The data enters the network through the input layer and advances layer by layer to the output. At each stage, a calculation is performed based on the weights and bias, until a prediction is obtained.

Then they compare between the prediction and the true value. The difference between them is called error.

To measure the error, dedicated functions are used.

- Loss measures the error for one example.

- Cost measures the error across all examples.

This way one can understand how accurate the model is.

In the second stage, Backward Propagation

They start from the error and propagate it backward through the network.

At each layer, they calculate how much each weight contributed to the error, and update it accordingly. That is, if a certain weight caused a large error, they change it so that next time the error will be smaller.

This process is repeated again and again: forward pass ← error calculation ← backward pass ← weight update

This way the network gradually improves and learns to refine its predictions.
