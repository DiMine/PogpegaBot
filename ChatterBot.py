from chatterbot import ChatBot
from chatterbot.trainers import ChatterBotCorpusTrainer
import sys

chatbot = ChatBot('Ron Obvious')

# Create a new trainer for the chatbot
#trainer = ChatterBotCorpusTrainer(chatbot)

# Train the chatbot based on the english corpus
#trainer.train("chatterbot.corpus.english")

print(chatbot.get_response(sys.argv[0]))

# Get a response to an input statement
#for line in sys.stdin:
#    print(chatbot.get_response(line))