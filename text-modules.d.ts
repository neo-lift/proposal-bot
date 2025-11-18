declare module "*.txt?raw" {
  const content: string;
  export default content;
}

declare module "@/prompts/*.txt?raw" {
  const content: string;
  export default content;
}

