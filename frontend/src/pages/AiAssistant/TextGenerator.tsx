import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { PlusIcon } from "../../icons";

export default function TextGenerator() {
  const [prompt, setPrompt] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock response
    const mockResponses: { [key: string]: string } = {
      professional:
        "Thank you for reaching out. We appreciate your interest in our services and would be happy to assist you further. Our team is dedicated to providing the highest quality solutions tailored to your specific needs.",
      casual:
        "Hey there! Thanks for getting in touch. We're excited to help you out and make sure everything goes smoothly. Just let us know what you need, and we'll take care of it!",
      creative:
        "In a world of endless possibilities, your words paint a canvas of inspiration. We journey together through the tapestry of innovation, crafting stories that resonate with the soul.",
      technical:
        "Implementing advanced natural language processing algorithms with machine learning integration to optimize text generation parameters. Our neural network architecture processes semantic structures through deep learning models.",
    };

    const response =
      mockResponses[tone as keyof typeof mockResponses] ||
      mockResponses.professional;
    setGeneratedText(response);
    setIsLoading(false);
  };

  const handleClear = () => {
    setPrompt("");
    setGeneratedText("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    alert("Copied to clipboard!");
  };

  return (
    <>
      <PageMeta
        title="Text Generator | Dalli Template"
        description="AI-powered text generation tool"
      />
      <PageBreadcrumb pageTitle="Text Generator" />
      
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Description Section */}
        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-1 dark:border-gray-800 dark:bg-gray-800 md:p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Generate creative, professional, or custom text using AI. Enter a
              prompt and let our AI create the perfect content for you.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 grid grid-cols-12 gap-4 md:gap-6 lg:col-span-8">
          {/* Input Section */}
          <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-4 shadow-1 dark:border-gray-800 dark:bg-gray-800 md:p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Your Prompt
            </h2>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your text generation prompt here... (e.g., 'Write a professional email response to a customer inquiry')"
              className="mb-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition focus:border-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              rows={6}
            />

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="creative">Creative</option>
                  <option value="technical">Technical</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Length
                </label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-medium text-white transition hover:bg-brand-600 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700"
              >
                <PlusIcon className="w-5 h-5" />
                {isLoading ? "Generating..." : "Generate Text"}
              </button>
              <button
                onClick={handleClear}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-900 transition hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Output Section */}
          {generatedText && (
            <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-4 shadow-1 dark:border-gray-800 dark:bg-gray-800 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Generated Text
                </h2>
                <button
                  onClick={handleCopy}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                >
                  Copy
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="whitespace-pre-wrap text-gray-900 dark:text-white">
                  {generatedText}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Tips & Examples */}
        <div className="col-span-12 lg:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-1 dark:border-gray-800 dark:bg-gray-800 md:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Tips & Examples
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                  Email Response
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Write a professional email response to a customer inquiry about
                  product features
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                  Social Media Post
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create an engaging social media post about our latest product
                  launch
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                  Product Description
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Write an SEO-optimized product description for an e-commerce
                  listing
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                  Blog Post Outline
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create an outline for a blog post about digital marketing trends
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                💡 <strong>Pro Tip:</strong> The more specific your prompt, the
                better the generated text will match your needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
