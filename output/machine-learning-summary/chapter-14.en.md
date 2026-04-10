# Random Forest

<img src="../assets/image-14.png" alt="image-14.png" width="625" height="396" />

Random Forest is a model based on a large number of Decision Trees working together.

Instead of relying on a single tree, the model builds many different trees, each making a slightly different decision. The idea is not to make one decision, but to combine many decisions.

The process starts from the training data. From this data, several different subsets are created, and additionally, each tree uses only part of the features. This way, each tree learns a slightly different picture of the data.

The diagram shows that each tree is built similarly, but the path through which it makes decisions differs. Each tree reaches its own result, based on the data it saw.

At the end of the process, the model doesn't choose the result of a single tree, but combines all results. If it's classification, a decision is made by majority vote. If it's numerical prediction, an average is calculated between all results.

This means the model is less sensitive to errors of a single tree. Instead of one decision that could be wrong, a more stable decision is received based on many trees.

Thus Random Forest improves accuracy and reliability, while maintaining the simple idea of decision trees.
