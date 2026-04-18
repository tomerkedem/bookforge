# Example of a New Feature Interface - Verint AI Insights

They allow the customer to take a subset of calls, it can be a few hundred calls that represent some business topic and they want to understand insights related to it.

For example: if they have a case of customer churn and they want to do **Retention** (the term in customer service refers to the ability of a business **to keep existing customers over time**, instead of losing them to competitors).

So they can talk to the bot and tell it to give me scripts that help retain customers, so it takes all the calls and brings the insights from the calls, all insights are based on real calls.

<img src="/ai-engineering-intro/assets/image-03.png" alt="image-03.png" width="538" height="275" />

Until today they had to listen to all the calls which took them a lot of time, today it's done in seconds automatically and customers are very satisfied and really love it.

Within a call center management system. This is a classic application of **GenAI** serving as a "coach" for managers or agents.


**User Query:** "Can you suggest a script that will help with customer retention?"

**AI Response:**

"Based on interactions (calls) where successful retention was performed, it is recommended to train employees to emphasize the value and uniqueness of the offers:"

Examples:

Plan Exclusivity:

Quote from call (September 19): "You are on an exclusive plan."

Peace of Mind:

Quote from call (September 17): "We are always here when you need us."



**What's happening here at the technical level?**

To achieve this result, the system performs several complex operations behind the scenes:

• **RAG (Retrieval-Augmented Generation):**

The AI doesn't just make up a generic answer. It accesses the database of transcribed calls, searches for calls marked as "successful retention," and extracts from them the sentences that worked best.

• **Semantic Search:**

The system understands the context of "retention" and searches for sentences with similar meaning (such as exclusivity or service quality).

• **Actionable Insights:** 

This is an insight you can act on. Instead of just saying "retention improved," the system tells the call center manager exactly what to tell agents in the next training.


**Why is this critical in AI systems?**

In the example presented, the AI didn't just say "customer retention is important." It performed an **Actionable Insight** by:

1. Analyzing what worked in successful calls.

2. Distilling it into specific sentences ("You're on an exclusive plan").

3. Giving guidance to the manager: "It is recommended to train employees to use these sentences."

**Components of an Actionable Insight:**

• **Context:** Why is this happening?

• **Relevance:** Is this important to the business now?

• **Recommendation for Action:** What's the next step?

When you build such a feature, the goal is that the end user (call center manager) won't need to "rack their brain" about what to do with the graphs. The system should serve them the solution on a silver platter.
