# Linear Regression

<img src="../assets/image-11.png" alt="image-11.png" width="710" height="326" />

Linear Regression is used to learn relationships between variables for the purpose of predicting numerical values.

In the diagram, we see blue points, each point represents actual data.

The red line is the model, and it represents the relationship the model found between the data.

The model doesn't search for a line that passes through all points, but rather a line that minimizes the overall error.

How do we measure fit?

Each point has a distance from the line, this distance is called error.

In the diagram, the errors are marked by vertical dashed lines between the points and the line.

To choose the best line, the model calculates the error for each point, squares it, and sums them all.
The chosen line is the one where the sum of squared errors is the smallest.

This is the idea shown in the diagram: "Minimizing squared error"

This means the model doesn't seek perfect accuracy for every point, but rather a line that balances the overall error in the best way.

Finally, the line enables making predictions.
For any value on the X axis, you can find the corresponding value on the line, and this is the predicted value.

When you want to predict a numerical value, you use Linear Regression, and when you want to assign to a category, you use a different approach.

This is a central prin ciple in learning: not perfect fit, but error optimization
