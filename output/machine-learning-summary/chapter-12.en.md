# Logistic Regression

<img src="../assets/image-12.png" alt="image-12.png" width="562" height="352" />

While linear regression tries to predict a numerical value on an infinite continuum, logistic regression is an algorithm used for classification. Its purpose is to estimate the probability that a given data point belongs to a certain category (for example: "0" or "1").

The mathematical mechanism: The Sigmoid Function

To "confine" the calculation to a range between 0 and 1 representing probability, the model uses the logistic function (sigmoid):

This function maps any numerical input to a probability of belonging to a group. The more positive and large the calculation value, the closer the result approaches 1; the more negative and small, the closer it approaches 0.

The transition to classification: Decision Threshold

In the first stage, the model returns a probability (for example: 0.72). To turn this into a final decision, we need to set a threshold, which typically stands at 0.5:

Positive classification (Class 1): when the model output

Negative classification (Class 0): when the model output
