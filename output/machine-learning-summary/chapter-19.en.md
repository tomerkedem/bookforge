# Reinforcement Learning

<img src="../assets/image-21.png" alt="image-21.png" width="515" height="267" />

In reinforcement learning, the model doesn't receive correct answers in advance, but learns through experience. Instead of learning from examples, it learns through interaction with an environment.

The model acts as an agent that receives a state, performs an action, and then receives a reward from the environment. The reward can be positive when the action is correct, or negative when it's wrong.

The process repeats itself again and again. At each step, the agent tries to choose a better action based on the experience it has accumulated. Over time, it learns which actions lead to better results, and which less so.

In the diagram one can see the central loop: the agent acts within an environment, receives a reward, and updates the model accordingly. This is a continuous process of trial and error that leads to behavior improvement.

Unlike supervised learning, there is no correct answer in advance. The goal is to maximize the reward over time, meaning to learn a policy that leads to the best results.

This approach is common in systems that require real-time decision making, such as autonomous driving, games, or control systems.
