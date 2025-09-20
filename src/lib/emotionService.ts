import { pipeline } from "@xenova/transformers"

// Lazy-load classifier
let classifier: any = null

export async function getEmotion(text: string) {
  if (!classifier) {
    classifier = await pipeline(
      "text-classification",
      "bhadresh-savani/distilbert-base-uncased-emotion" // 6 emotions
    )
  }

  const result = await classifier(text, { topk: 1 })
  return result[0].label // e.g., "joy", "sadness", "anger"
}

export function mapEmotionToSentiment(
  emotion: string
): "Positive" | "Negative" | "Neutral" {
  const positiveSet = ["joy", "love", "surprise"]
  const negativeSet = ["anger", "sadness", "fear"]
  if (positiveSet.includes(emotion)) return "Positive"
  if (negativeSet.includes(emotion)) return "Negative"
  return "Neutral"
}
