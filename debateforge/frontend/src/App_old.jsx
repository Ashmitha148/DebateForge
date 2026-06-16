import { useState } from "react";
import { debate } from "./api/debate";

function App() {
  const [topic, setTopic] = useState("");
  const [argument, setArgument] = useState("");
  const [reply, setReply] = useState("");

  async function send() {
    try {
      const data = await debate(topic, argument);

      setReply(data.reply);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>DebateForge</h1>

      <input
        placeholder="Topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />

      <br />
      <br />

      <input
        placeholder="Your Argument"
        value={argument}
        onChange={(e) => setArgument(e.target.value)}
      />

      <br />
      <br />

      <button onClick={send}>Debate</button>

      <br />
      <br />

      <p>{reply}</p>
    </div>
  );
}

export default App;
