# Gradient Boosting (XGBoost)

<img src="../assets/image-15.png" alt="image-15.png" width="632" height="322" />

<img src="../assets/image-16.png" alt="image-16.png" width="709" height="333" />

XGBoost is a model based on a combination of trees, but unlike Random Forest, here the trees don't work in parallel but are built one after another.

The central idea is gradient boosting, meaning improving the model by focusing on errors from previous stages.

At the beginning of the process, a first tree is built based on the data. Then we check where the model made mistakes. The points where an incorrect prediction was received get higher importance.

The next tree is built to correct these errors. The tree after that continues with the same principle. At each stage, the model improves a bit more.

The diagram shows how the data changes between stages. Points that were classified correctly receive less emphasis, while incorrect points stand out more and influence the learning of the next tree.

At the end of the process, all trees are combined together to create a final prediction. But unlike Random Forest where all trees are equal, here each tree has a weight, according to its contribution to improving the model.

This creates a strong model based on continuous correction of errors, not just an average of decisions.
