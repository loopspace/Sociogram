import random

letters = [chr(x + 65) + chr(x+97)*3 for x in range(26)]

for i in range(26):
     nletters = letters[:i] + letters[i+1:]
     random.shuffle(nletters)
     m = random.randint(1,4)
     n = random.randint(0,3)
     if m+n > 0:
          print(letters[i], end="; ")
          print(", ".join(nletters[0:m]), end="; ")
          print(", ".join(nletters[m:m+n]))
