import random

letters = [chr(x + 97) for x in range(26)]

for i in range(26):
     print(chr(i+97), end="; ")
     random.shuffle(letters)
     n = random.randint(0,4)
     print(", ".join(letters[0:n]), end="; ")
     print(", ".join(letters[n:n+random.randint(0,4)]))
