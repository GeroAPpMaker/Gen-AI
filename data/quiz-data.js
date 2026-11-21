// ================================================================
//  QUIZ DATA — all six modules
//  Each question: id, module, text, options[], correctIndex, explanation
//  correctIndex is 0-based index into options[].
//  Shuffling is done at runtime by quiz.js; correctIndex always
//  refers to the original options[] order stored here.
// ================================================================

const QUIZ_DATA = {

  prompt: [
    {
      id: 'pe-1',
      module: 'prompt',
      text: 'What does the "C" in the CRAFT framework stand for?',
      options: ['Command', 'Context', 'Create', 'Conversation'],
      correctIndex: 1,
      explanation: 'C = Context — provide background info and set the scene for the AI so it understands your situation.'
    },
    {
      id: 'pe-2',
      module: 'prompt',
      text: 'What is "Chain-of-Thought" prompting?',
      options: [
        'Sending multiple messages in a row quickly',
        'Asking AI to think step-by-step before answering',
        'Chaining multiple AI tools together',
        'Using AI to grade a chain of assignments'
      ],
      correctIndex: 1,
      explanation: 'Chain-of-Thought means asking AI to reason step-by-step before giving a final answer, which dramatically improves reasoning quality.'
    },
    {
      id: 'pe-3',
      module: 'prompt',
      text: 'In "Few-Shot Learning," what do you provide to the AI?',
      options: [
        'A few photos of your classroom',
        '1–3 examples of the output you want, so AI can match the pattern',
        'A few seconds of voice recording',
        'A small amount of training data to retrain the model'
      ],
      correctIndex: 1,
      explanation: 'Few-Shot Learning: provide 1–3 examples so AI matches your desired style, depth, and quality.'
    },
    {
      id: 'pe-4',
      module: 'prompt',
      text: 'Which of the following is the most professionally written prompt?',
      options: [
        '"Make a worksheet"',
        '"Act as a 6th grade ELA teacher. Create a vocabulary worksheet for Greek mythology with 15 words, definitions, context sentences, and a matching section. Format as a one-page printable with an answer key."',
        '"I need help with vocabulary"',
        '"Worksheet please"'
      ],
      correctIndex: 1,
      explanation: 'The detailed prompt includes Role, Action, Context, Format, and Target — all CRAFT elements — producing a much higher-quality result.'
    },
    {
      id: 'pe-5',
      module: 'prompt',
      text: 'What is "Constraint Prompting"?',
      options: [
        'Telling AI what NOT to do to improve results',
        'Limiting how many times you can use AI per day',
        'Restricting AI to only answer math questions',
        'Using AI only during class time'
      ],
      correctIndex: 0,
      explanation: 'Constraint Prompting tells AI what NOT to do (e.g., "do not use jargon"), which often improves output quality significantly.'
    },
    {
      id: 'pe-6',
      module: 'prompt',
      text: 'What is the MOST important principle of effective prompt engineering?',
      options: [
        'Use as few words as possible',
        'Always use formal language',
        'Be specific and provide context — the more detail, the better the output',
        'Always start with "Please"'
      ],
      correctIndex: 2,
      explanation: 'Specificity and context are the most fundamental principles — detail drives quality because AI can only work with the information you give it.'
    },
    {
      id: 'pe-7',
      module: 'prompt',
      text: 'What does "R" stand for in the CRAFT framework?',
      options: ['Result', 'Role', 'Request', 'Respond'],
      correctIndex: 1,
      explanation: 'R = Role — assigning a specific persona (e.g., "Act as an experienced 4th grade teacher") focuses the AI\'s tone and expertise.'
    },
    {
      id: 'pe-8',
      module: 'prompt',
      text: 'Which trigger phrase is most effective for Chain-of-Thought prompting?',
      options: [
        '"Answer quickly."',
        '"Give me a short reply."',
        '"Think step by step before answering."',
        '"Use bullet points."'
      ],
      correctIndex: 2,
      explanation: '"Think step by step" explicitly instructs the AI to show its reasoning process before providing the final answer.'
    }
  ],

  'gemini-chat': [
    {
      id: 'gc-1',
      module: 'gemini-chat',
      text: 'Which of the following best describes Gemini\'s "multimodal" capability?',
      options: [
        'It can only process text input',
        'It can understand and work with text, images, audio, and video',
        'It runs on multiple devices at once',
        'It supports multiple chat windows simultaneously'
      ],
      correctIndex: 1,
      explanation: 'Multimodal means Gemini can process and reason across different input types — text, images, audio, and video — in a single conversation.'
    },
    {
      id: 'gc-2',
      module: 'gemini-chat',
      text: 'What can a teacher accomplish by uploading an image to Gemini Chat?',
      options: [
        'Nothing — Gemini cannot process images',
        'Only identify objects in the image',
        'Analyze the image content, describe it, extract text, or answer questions about it',
        'Only translate text visible in the image'
      ],
      correctIndex: 2,
      explanation: 'Gemini\'s image analysis can describe scenes, extract and interpret text, answer questions about visual content, and more.'
    },
    {
      id: 'gc-3',
      module: 'gemini-chat',
      text: 'What are Gemini Extensions?',
      options: [
        'Plugins that give Gemini access to real-time data and Google services like Search, Maps, and Workspace',
        'Extra characters added to the end of a prompt',
        'Premium subscriptions for advanced features',
        'Browser add-ons that change Gemini\'s appearance'
      ],
      correctIndex: 0,
      explanation: 'Extensions connect Gemini to live data sources and Google services, allowing it to search the web, check your calendar, or access Workspace files.'
    },
    {
      id: 'gc-4',
      module: 'gemini-chat',
      text: 'How does Gemini integrate with Google Workspace for educators?',
      options: [
        'It only integrates with Gmail',
        'It can help draft content inside Docs, Slides, Sheets, and other Workspace apps via the Gemini side panel',
        'Integration requires a paid upgrade for each app',
        'It replaces Google Classroom entirely'
      ],
      correctIndex: 1,
      explanation: 'The Gemini side panel in Workspace apps (Docs, Slides, Sheets, etc.) lets teachers generate, summarize, and edit content without leaving the app.'
    },
    {
      id: 'gc-5',
      module: 'gemini-chat',
      text: 'A teacher wants Gemini to remember context from earlier in a long conversation. What is the best approach?',
      options: [
        'Start a new chat for every follow-up question',
        'Continue in the same conversation thread so Gemini retains the context',
        'Summarize everything in a new prompt each time',
        'Use a different AI tool'
      ],
      correctIndex: 1,
      explanation: 'Gemini maintains context within a single conversation thread, so continuing in the same chat gives better, context-aware responses.'
    },
    {
      id: 'gc-6',
      module: 'gemini-chat',
      text: 'Which use case is NOT well-suited for Gemini Chat?',
      options: [
        'Brainstorming lesson ideas',
        'Analyzing a student essay uploaded as an image',
        'Running locally without an internet connection',
        'Drafting a parent newsletter'
      ],
      correctIndex: 2,
      explanation: 'Gemini Chat requires an internet connection — it runs in the cloud. For offline use, Gemini Nano (on-device) is the right tool.'
    },
    {
      id: 'gc-7',
      module: 'gemini-chat',
      text: 'What is the main advantage of using Gemini Chat for content creation over a basic search engine?',
      options: [
        'Gemini shows more ads',
        'Gemini generates original, customized content based on your specific context and needs',
        'Gemini is faster at finding existing web pages',
        'Gemini stores your files for you'
      ],
      correctIndex: 1,
      explanation: 'Unlike a search engine that finds existing pages, Gemini generates new, tailored content — lesson plans, rubrics, emails — customized to your exact context.'
    }
  ],

  canvas: [
    {
      id: 'cv-1',
      module: 'canvas',
      text: 'What is Gemini Canvas primarily designed for?',
      options: [
        'Drawing and sketching diagrams',
        'Side-by-side AI-assisted document and code creation with inline editing',
        'Managing a photo library',
        'Video editing with AI captions'
      ],
      correctIndex: 1,
      explanation: 'Canvas provides a split-screen workspace where you edit a document or code file on one side while chatting with Gemini on the other, enabling true co-creation.'
    },
    {
      id: 'cv-2',
      module: 'canvas',
      text: 'How does inline editing in Canvas differ from a standard Gemini Chat interaction?',
      options: [
        'There is no difference — Canvas is just Gemini Chat with a different name',
        'In Canvas you can select a specific section of text and ask Gemini to rewrite only that part',
        'Canvas only works with code, not documents',
        'Canvas requires you to copy-paste text manually between the AI and your document'
      ],
      correctIndex: 1,
      explanation: 'Inline editing lets you highlight any section of the document in Canvas and give targeted instructions — rewrite, shorten, adjust tone — without touching the rest.'
    },
    {
      id: 'cv-3',
      module: 'canvas',
      text: 'A teacher wants to create a coding activity for students. How can Canvas help?',
      options: [
        'Canvas cannot handle code — only text documents',
        'Canvas can generate, explain, debug, and iteratively improve code alongside a chat',
        'Canvas automatically deploys the code to a school server',
        'Canvas converts code into images for presentations'
      ],
      correctIndex: 1,
      explanation: 'Canvas has a code mode where Gemini writes and iterates on code while explaining each step, making it ideal for creating classroom coding examples or activities.'
    },
    {
      id: 'cv-4',
      module: 'canvas',
      text: 'What does the Version History feature in Canvas allow educators to do?',
      options: [
        'Compare AI pricing across different models',
        'Review and restore earlier drafts of a document created in Canvas',
        'Share the document with students automatically',
        'Track how many words the AI wrote versus the teacher'
      ],
      correctIndex: 1,
      explanation: 'Version History saves snapshots of the document as it evolves, so you can review changes, compare drafts, or restore a previous version at any time.'
    },
    {
      id: 'cv-5',
      module: 'canvas',
      text: 'Which workflow best demonstrates effective use of Canvas for lesson material creation?',
      options: [
        'Type a prompt, copy the AI response into Word, edit there, then paste back',
        'Open Canvas, have Gemini draft a lesson plan, then select specific sections to refine in real time',
        'Use Canvas only for final formatting after writing everything yourself',
        'Ask Gemini to generate 10 separate files and pick the best one'
      ],
      correctIndex: 1,
      explanation: 'Canvas shines when you iterate in real time — start with an AI draft and refine specific parts inline, keeping everything in one collaborative workspace.'
    },
    {
      id: 'cv-6',
      module: 'canvas',
      text: 'Canvas is accessed through which platform?',
      options: [
        'A standalone app downloaded from the App Store',
        'Inside Gemini Chat at gemini.google.com',
        'Google Classroom\'s assignment builder',
        'A separate website at canvas.google.com'
      ],
      correctIndex: 1,
      explanation: 'Canvas is embedded within Gemini Chat — you activate it from within a Gemini conversation, not as a separate application.'
    }
  ],

  gems: [
    {
      id: 'gm-1',
      module: 'gems',
      text: 'What is a Custom Gem in Gemini?',
      options: [
        'A premium subscription feature that unlocks extra responses',
        'A personalized AI assistant with saved custom instructions for a specific, repeatable task',
        'A collection of pre-made lesson plan templates',
        'A badge earned after completing all Gemini modules'
      ],
      correctIndex: 1,
      explanation: 'A Gem is a customized Gemini persona with saved instructions, so you don\'t have to re-explain your context every time — it always knows its role and your preferences.'
    },
    {
      id: 'gm-2',
      module: 'gems',
      text: 'Which component is most important when writing custom instructions for a Gem?',
      options: [
        'Using the longest possible description',
        'Defining the role, tone, goals, and any specific constraints clearly',
        'Including as many example prompts as possible',
        'Setting a word limit for all responses'
      ],
      correctIndex: 1,
      explanation: 'Effective Gem instructions clearly define role (who it is), tone (how it communicates), goals (what it helps with), and constraints (what it should avoid).'
    },
    {
      id: 'gm-3',
      module: 'gems',
      text: 'A "Lesson Plan Gem" is most useful because:',
      options: [
        'It automatically submits lesson plans to your school\'s LMS',
        'It remembers your grade level, subject, and style preferences so every new lesson plan request is already in context',
        'It generates lesson plans faster than any other method',
        'It replaces the need to review AI-generated content'
      ],
      correctIndex: 1,
      explanation: 'The Lesson Plan Gem has your grade, subject, standards, and preferred format saved — no need to re-explain every time you want a new lesson.'
    },
    {
      id: 'gm-4',
      module: 'gems',
      text: 'How would a "Grading Assistant Gem" help a teacher most effectively?',
      options: [
        'By automatically submitting grades to the grade book',
        'By applying a saved rubric and feedback style consistently to every piece of student work you share with it',
        'By writing the student\'s work for them',
        'By printing graded papers automatically'
      ],
      correctIndex: 1,
      explanation: 'A Grading Assistant Gem stores your rubric and feedback preferences, ensuring consistent, rubric-aligned feedback every time — saving significant preparation time.'
    },
    {
      id: 'gm-5',
      module: 'gems',
      text: 'What is the main benefit of creating a "Student Tutor Gem" for a specific subject?',
      options: [
        'It monitors student screen time',
        'It delivers personalized, subject-specific explanations and hints tailored to your curriculum without revealing direct answers',
        'It grades student answers automatically',
        'It syncs with parents\' email accounts'
      ],
      correctIndex: 1,
      explanation: 'A Student Tutor Gem is configured to explain concepts, offer hints, and use Socratic questioning in a specific subject area — not just provide answers.'
    },
    {
      id: 'gm-6',
      module: 'gems',
      text: 'Custom Gems are available through which Gemini plan?',
      options: [
        'Free tier at gemini.google.com for everyone',
        'Gemini Advanced (paid) or Google Workspace for Education with the appropriate license',
        'Only through a school IT admin account',
        'Only available in the US'
      ],
      correctIndex: 1,
      explanation: 'Creating and saving Custom Gems requires Gemini Advanced or a qualifying Google Workspace for Education license.'
    }
  ],

  notebooklm: [
    {
      id: 'nb-1',
      module: 'notebooklm',
      text: 'What makes NotebookLM fundamentally different from standard Gemini Chat?',
      options: [
        'NotebookLM can only be used offline',
        'NotebookLM grounds all responses exclusively in sources YOU upload — it doesn\'t draw from the open internet',
        'NotebookLM is faster than Gemini Chat',
        'NotebookLM automatically publishes your notes online'
      ],
      correctIndex: 1,
      explanation: 'NotebookLM uses only your uploaded sources as its knowledge base, ensuring every answer is grounded in your documents — not random internet content.'
    },
    {
      id: 'nb-2',
      module: 'notebooklm',
      text: 'A teacher uploads a textbook chapter to NotebookLM. What can it do with that source?',
      options: [
        'Only display the text as-is',
        'Generate summaries, study guides, FAQs, quizzes, and answer questions about the content',
        'Only translate the text to other languages',
        'Only highlight key terms'
      ],
      correctIndex: 1,
      explanation: 'NotebookLM can analyze uploaded sources deeply — producing summaries, study guides, timelines, FAQs, and even audio overviews from your documents.'
    },
    {
      id: 'nb-3',
      module: 'notebooklm',
      text: 'What is the Audio Overview feature in NotebookLM?',
      options: [
        'A text-to-speech reader that reads your notes aloud',
        'An AI-generated podcast-style discussion between two hosts that summarizes your sources',
        'A tool for recording your own voice notes',
        'An audio transcription tool that converts speech to text'
      ],
      correctIndex: 1,
      explanation: 'Audio Overview generates a conversational, podcast-style summary of your uploaded sources — great for auditory learners or reviewing on the go.'
    },
    {
      id: 'nb-4',
      module: 'notebooklm',
      text: 'How should a teacher use NotebookLM to build a study guide for students?',
      options: [
        'Manually copy content from NotebookLM into a Word document',
        'Upload the relevant course materials and ask NotebookLM to generate a structured study guide from those sources',
        'Ask NotebookLM to search the internet for existing study guides',
        'Use NotebookLM to grade existing student study guides'
      ],
      correctIndex: 1,
      explanation: 'Upload your course materials and prompt NotebookLM to synthesize a study guide — it will draw only from your documents, ensuring curriculum alignment.'
    },
    {
      id: 'nb-5',
      module: 'notebooklm',
      text: 'What does NotebookLM\'s FAQ generation feature do?',
      options: [
        'Finds frequently asked questions on the internet about a topic',
        'Automatically generates likely student questions and answers based on your uploaded source documents',
        'Sends automated FAQs to parents by email',
        'Creates a form for students to submit questions'
      ],
      correctIndex: 1,
      explanation: 'NotebookLM reads your sources and anticipates the questions learners would likely ask, then answers them from the source material — perfect for student prep.'
    },
    {
      id: 'nb-6',
      module: 'notebooklm',
      text: 'Which statement about citations in NotebookLM is correct?',
      options: [
        'NotebookLM never cites sources because it generates new content',
        'NotebookLM links its responses to the specific passages in your uploaded sources where the information came from',
        'NotebookLM cites sources from the internet',
        'Citations are only available in the paid version'
      ],
      correctIndex: 1,
      explanation: 'Every NotebookLM response includes inline citations pointing to the exact passage in your uploaded sources — so you can verify accuracy instantly.'
    }
  ],

  nano: [
    {
      id: 'nn-1',
      module: 'nano',
      text: 'What is the defining characteristic of Gemini Nano compared to other Gemini models?',
      options: [
        'It has the most parameters and is the most powerful model',
        'It runs directly on the device (on-device AI) without sending data to the cloud',
        'It is only available on desktop computers',
        'It requires a Gemini Advanced subscription'
      ],
      correctIndex: 1,
      explanation: 'Gemini Nano is an on-device model — it processes everything locally on your device, with no data sent to Google\'s servers.'
    },
    {
      id: 'nn-2',
      module: 'nano',
      text: 'Which scenario is the BEST use case for Gemini Nano in a school setting?',
      options: [
        'Generating a 10,000-word research report',
        'Quick, private AI-assisted writing suggestions on a Chromebook in a classroom with limited internet',
        'Real-time video analysis of a full-class presentation',
        'Connecting to live Google Search results'
      ],
      correctIndex: 1,
      explanation: 'Nano excels at quick on-device tasks where privacy matters or connectivity is unreliable — like writing suggestions or summarization on a local device.'
    },
    {
      id: 'nn-3',
      module: 'nano',
      text: 'How is Gemini Nano accessed on a supported Chromebook or Android device?',
      options: [
        'By downloading a separate "Gemini Nano" app from the Play Store',
        'It is built into the operating system and surfaces through features like Smart Reply, Summarize, or Help Me Write',
        'It requires logging into gemini.google.com',
        'It must be enabled by a school IT administrator before each use'
      ],
      correctIndex: 1,
      explanation: 'Nano is embedded into the OS and surfaces through built-in features (Smart Reply, Help Me Write, etc.) — there is no separate app to download.'
    },
    {
      id: 'nn-4',
      module: 'nano',
      text: 'Why is Gemini Nano a privacy-friendly option for handling sensitive student information?',
      options: [
        'Because it deletes all data after every session',
        'Because processing happens entirely on the device — no student data leaves the device or is sent to external servers',
        'Because it encrypts all files stored on Google Drive',
        'Because it requires parental consent before each use'
      ],
      correctIndex: 1,
      explanation: 'On-device processing means no data ever leaves the hardware — ideal for handling student names, grades, or other sensitive information with strict privacy requirements.'
    },
    {
      id: 'nn-5',
      module: 'nano',
      text: 'What is a known trade-off when using Gemini Nano versus Gemini\'s cloud-based models?',
      options: [
        'Nano costs significantly more',
        'Nano is more capable for complex, long-form tasks but slower',
        'Nano is more limited in capability (smaller model) but faster and private',
        'Nano cannot handle English-language tasks'
      ],
      correctIndex: 2,
      explanation: 'On-device models are smaller to fit on hardware, so they\'re less capable for complex reasoning or long documents — but faster for simple tasks and completely private.'
    },
    {
      id: 'nn-6',
      module: 'nano',
      text: 'Which browser has Gemini Nano built-in features for desktop users?',
      options: ['Firefox', 'Safari', 'Microsoft Edge', 'Google Chrome (version 131+)'],
      correctIndex: 3,
      explanation: 'Chrome 131 and later ships with built-in Gemini Nano APIs, enabling on-device AI features directly in the browser without any additional app.'
    }
  ]

};

// Freeze to prevent accidental mutation
Object.freeze(QUIZ_DATA);
