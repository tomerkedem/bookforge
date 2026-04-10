# Decision Tree

<img src="../assets/image-13.png" alt="image-13.png" width="596" height="376" />

A decision tree is a model that makes decisions through a series of simple questions. Instead of trying to understand all the data at once, it progresses step by step, asking only one question at each step. The answer to this question determines where to continue, creating a clear path that ultimately leads to a result.

The diagram shows how this process occurs in practice. Starting from a general question about gender. If it's a female, the model already reaches a result and concludes she survived. If it's a male, a decision isn't made immediately, but another question is asked about age. Here too, according to the answer, we proceed to the next stage. If the age is below a certain threshold, another datum like the number of family members (sibsp) is examined, and only then is a decision made.

Each node in the tree represents a question about one of the variables, and each branch represents a possible answer. When you reach the end of the tree, the final decision is made. This is the value the model returns.

Alongside each result, numbers appear providing additional context. The numerical value represents probability, meaning how confident the model is in its decision. The percentages show how many of the data points went through this path in the tree. This allows understanding not only what the decision is, but also how well-founded it is.

The uniqueness of Decision Tree is that you can follow every step in the process. Each decision stems from a clear question, and every path can be explained. Instead of a complex model that's hard to understand how it reached a result, here you can see exactly how the data led to the decision.
