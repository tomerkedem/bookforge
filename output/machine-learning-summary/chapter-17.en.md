# Supervised vs Unsupervised Learning

<img src="../assets/image-19.png" alt="image-19.png" width="726" height="314" />

The comparison between supervised and unsupervised learning focuses on three main aspects: uses, complexity, and disadvantages.

In terms of uses,

Supervised learning is suitable for situations where there is labeled data, and therefore can be used for tasks
such as: spam detection, sentiment analysis, or price prediction.

Unsupervised learning is suitable for situations where there are no labels, and is used for anomaly detection, recommendation systems, customer segmentation, and medical information analysis.

In terms of complexity,

Supervised learning is considered a simpler approach when labeled data exists, and can be implemented using common tools like Python or R.

Unsupervised learning usually requires more complex processing, working with large amounts of data and high computing power.

In terms of disadvantages,

In supervised learning, there is a need for manual labeling of data, which requires time and expertise.

In unsupervised learning, since there is no correct answer to compare with, it's difficult to assess the quality of the result and sometimes human validation is required.

In unsupervised learning, the model doesn't receive correct answers in advance, so it focuses on discovering internal structure in the data.

Three main uses demonstrate how this is performed in practice.

- Clustering is a process of dividing unlabeled data into groups based on similarity. The model examines the proximity or similarity between points, and clusters similar data together. For example, customers can be divided into groups according to behavior, or recurring patterns in images can be identified. In algorithms like K-Means, the number of groups is determined in advance, and it affects the level of detail of the division.

- Association focuses on identifying relationships between variables. Instead of dividing into groups, the model searches for rules that appear together. For example, if customers who buy one product tend to also buy another product, this relationship can be identified and used for recommendations. This is the basis for recommendation systems and shopping cart analysis.

- Dimensionality Reduction deals with reducing the number of variables in the data. When there are many features, it's difficult to analyze the information efficiently. The model reduces dimensions while preserving important information. This allows working with simpler data, reducing noise, and improving performance of other models.

These three approaches represent different ways to discover structure in data: division into groups, discovering relationships, and reducing complexity.
