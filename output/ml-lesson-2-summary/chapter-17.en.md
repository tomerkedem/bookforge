# Supervised vs Unsupervised Learning

The difference between supervised and unsupervised learning is mainly expressed in three key aspects: uses, complexity, and disadvantages.

**In terms of uses**,

**Supervised learning** is suitable for situations where labeled data exists, meaning there is a known correct answer in advance. In such cases, tasks such as: spam detection, sentiment analysis or price prediction can be performed.

**Unsupervised learning** works when there are no labels, so its goal is not to predict a result but to discover structure and patterns in the data. It is used, among other things, for dividing customers into groups, recommendation systems, anomaly detection and medical data analysis.

**In terms of complexity**,

**Supervised learning** is considered simpler when labeled data exists, and can be implemented using common tools like Python or R.

**Unsupervised learning** usually requires more complex processing, working with large amounts of data and sometimes higher computing power.

**In terms of disadvantages**,

**In supervised learning** there is a need for manual labeling of the data, a process that requires time and expertise.

**In unsupervised learning**, since there is no correct answer to compare to, it is difficult to evaluate the quality of the result and sometimes human validation is required.

**Simply put, supervised learning focuses on prediction, while unsupervised learning focuses on discovery.**

In unsupervised learning the model does not receive correct answers in advance, so it focuses on discovering internal structure in the data.

**Three main uses illustrate how this is done in practice.**

<img src="/ml-lesson-2-summary/assets/image-17.png" alt="image-17.png" width="709" height="332" />

1. **Clustering** is a process of dividing unlabeled data into groups based on similarity. The model examines proximity or similarity between points, and groups similar data together. For example, you can divide customers into groups by behavior, or identify repeating patterns in images. In algorithms like K-Means, the number of groups is determined in advance, and it affects the level of detail of the division.

2. **Association** focuses on identifying relationships between variables. Instead of dividing into groups, the model looks for rules that appear together. For example, if customers who buy one product tend to buy another product as well, this relationship can be identified and used for recommendations. This is the basis for recommendation systems and shopping basket analysis.

3. **Dimensionality Reduction** deals with reducing the number of variables in the data. When there are many features, it is difficult to analyze the information efficiently. The model reduces dimensions while preserving important information. This way you can work with simpler data, reduce noise and improve performance of other models.

These three approaches represent different ways to discover structure in data: dividing into groups, discovering relationships, and reducing complexity.

