# Forward and Backward Propagation

To understand how a neural network learns, you need to know two main stages that repeat throughout the training process: forward pass and backward pass.

In forward propagation, data enters the network through the input layer and advances layer by layer until output is received. At each layer, computation is performed based on weights and bias, until a *prediction* is obtained.

In the illustration you can see the flow from left to right until the prediction stage.

After that, the prediction is compared to the actual value y, and the difference between them is called error.
**To measure the error, appropriate functions are used:**

Loss measures the error for a single example, and Cost measures the error across all data.

<img src="/ml-lesson-2-summary/assets/image-23.png" alt="image-23.png" width="636" height="347" />

In the next stage, backward propagation, the error spreads backward through the network, as shown in the illustration with the returning arrows. At each layer, it's calculated how much each weight contributed to the error, and it's updated so the error decreases.

This process repeats again and again: forward pass → error calculation → backward pass → weight update. In each iteration the network improves slightly, and learns to produce more accurate predictions.

In this way, the network doesn't receive correct answers in advance, but learns from mistakes, and gradually updates itself to maximize accuracy over time.

**The network learns by repeatedly correcting errors, and improves its predictions gradually**

**Deep Learning**

Deep Learning is an extension of neural networks, based on using a large number of computation layers.

Unlike simple networks, data passes through many layers, where each layer learns a different representation of the information. As we progress through the network, the representations become more complex and abstract.

In the illustration you can see how information flows from the input layer to the output, passing through many layers. At each step, additional processing is performed that highlights different patterns in the data.

In this way, the network doesn't just map input to output, but learns to represent the data at different levels of abstraction, where each layer adds another level of understanding.

<img src="/ml-lesson-2-summary/assets/image-24.png" alt="image-24.png" width="646" height="283" />

Deep Learning is a subfield of Machine Learning, so it's not a separate approach but an extension of the same method, based on deeper networks.

**To train such models, three main components are required:**
**A large amount of data, high computing power, and advanced training methods.**

This combination enables models to learn very complex relationships, and sometimes achieve particularly high performance in tasks like image recognition, natural language processing, speech recognition, and AI-based generation systems.

**The depth of the network is what enables the model to learn complex representations**

