import { useState, useEffect } from "react";
import LoadingBar from "react-top-loading-bar";
import {
  MLCEngineInterface,
  InitProgressReport,
  CreateMLCEngine,
  ChatCompletionMessageParam,
} from "@mlc-ai/web-llm";
import "./App.css";

function App() {
  const [progress, setProgress] = useState(0);
  const [chat, setChat] = useState(false);
  const [engine, setEngine] = useState<MLCEngineInterface | null>(null);
  const [text, setText] = useState("");
  const selectedModel = "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC-1k";
  const chatHistory: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: "hello",
    },
  ];

  useEffect(() => {
    createEngine();

    // Cleanup function to handle unmounting
    return () => {
      if (engine) {
        // Perform any necessary cleanup, like shutting down the engine
        //engine.shutdown(); // Replace with the appropriate cleanup function
      }
    };
  }, []);

  const initProgressCallback = (report: InitProgressReport) => {
    console.log(report.text, report.progress);
    setProgress(report.progress);
    if (report.progress == 1.0) {
      setChat(true);
    }
  };

  const createEngine = async () => {
    try {
      const newEngine = await CreateMLCEngine(selectedModel, {
        initProgressCallback: initProgressCallback,
      });
      setEngine(newEngine); // Save the engine instance to state
    } catch (error) {
      console.error("Failed to initialize the engine:", error);
    }
  };

  const updateAnswer = (message: string) => {
    console.log(message);
  };

  const startEngine = async (message: string) => {
    let currentMessage = "";
    chatHistory.push({ role: "user", content: message });
    const completion = await engine.chat.completions.create({
      stream: true,
      messages: chatHistory,
    });
    for await (const chunk of completion) {
      const currentDelta = chunk.choices[0].delta.content;
      if (currentDelta) {
        currentMessage += currentDelta;
      }
      updateAnswer(currentMessage);
      const response = await engine.getMessage();
      chatHistory.push({
        role: "assistant",
        content: response,
      });
    }
  };

  const submitRequest = () => {
    startEngine(text);
  };

  return (
    <>
      <div>
        <LoadingBar
          color="#f11946"
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
        />
      </div>
      {chat && (
        <div>
          <button onClick={submitRequest()}>go</button>
          <input
            id="input"
            onChange={(e) => {
              setText(e.target.value);
            }}
            value={text}
          />
          <pre id="response"></pre>
        </div>
      )}
    </>
  );
}

export default App;
