# Semi-supervised Learning

<img src="../assets/image-20.png" alt="image-20.png" width="447" height="355" />

Semi-supervised learning combines supervised learning with unsupervised learning.

Instead of working only with labeled data or only with unlabeled data, the model uses both types together. A small portion of the data includes labels, and most of the data is unlabeled.

This approach is especially useful when it's difficult or impossible to label all the data, or when identifying relevant features is complex.

In the workflow, the model starts by identifying a general structure in the data, for example using clustering. Then, it uses a small amount of labeled data to direct and improve the division. This creates a combination between pattern discovery and more accurate supervised learning.

In the diagram, one can understand that the model doesn't rely only on labels, but uses them as an anchor that helps interpret the rest of the data.

In cases like medical image analysis, only a small portion of samples can be labeled. Nevertheless, the model manages to significantly improve accuracy, because it also learns from the unlabeled data.

This creates an efficient approach that leverages partial information to achieve more accurate results.
