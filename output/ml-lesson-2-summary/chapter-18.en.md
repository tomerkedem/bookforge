# Semi-supervised Learning

Semi-supervised learning combines supervised and unsupervised learning, and allows learning from data where only a small part is labeled.

This approach is especially useful when there is a lot of data, but the labeling process is expensive, complex or requires human expertise.

Instead of relying only on labeled data, the model also uses unlabeled data.
The unlabeled data helps understand the general structure, while the labels serve as an anchor that guides the learning.

<img src="/ml-lesson-2-summary/assets/image-18.png" alt="image-18.png" width="710" height="301" />

In the work process, the model first identifies general patterns in the data, for example using Clustering. Then, it uses a small amount of labels to improve and refine the division.

This way a combination of structure discovery and more accurate prediction is achieved.

For example, in medical image analysis you can label only a small part of the examples, and still significantly improve model performance using the unlabeled data.

This results in an efficient approach that leverages partial information to achieve better results.

**Semi-supervised learning balances between prediction and discovery**

