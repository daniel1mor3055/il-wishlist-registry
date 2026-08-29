"""Building the link the couple sends to their WhatsApp group.

`noa-itai-h7k2m9qp`: a readable prefix so it is recognisable among fifty other
links, plus eight random characters so it is not guessable. The prefix is a
convenience, the suffix is the security - anyone holding the link is treated as
invited (D6), so the slug is a capability and must not be enumerable.

The romanisation below is approximate and cannot be otherwise: Hebrew script
does not write most vowels, so `איתי` has no recoverable spelling in Latin
letters. It aims at recognisable, not correct. Letting the couple edit the slug
belongs to the share screen, where they can see the link they are about to send.
"""

from __future__ import annotations

import re
import secrets
import unicodedata

# Vav and yod double as vowels; between consonants that is what they usually
# are, so they are mapped that way and the ambiguity is accepted.
HEBREW = {
    "א": "a",
    "ב": "b",
    "ג": "g",
    "ד": "d",
    "ה": "h",
    "ו": "o",
    "ז": "z",
    "ח": "h",
    "ט": "t",
    "י": "i",
    "כ": "k",
    "ך": "k",
    "ל": "l",
    "מ": "m",
    "ם": "m",
    "נ": "n",
    "ן": "n",
    "ס": "s",
    "ע": "a",
    "פ": "p",
    "ף": "f",
    "צ": "tz",
    "ץ": "tz",
    "ק": "k",
    "ר": "r",
    "ש": "sh",
    "ת": "t",
}

#: At the start of a word these two are consonants, not vowels. Mostly this is
#: about the conjunction: `ואיתי` is "and Itai", so it opens with a v sound.
WORD_INITIAL = {"ו": "v", "י": "y"}

#: No 0/o/1/l/i: the slug gets read aloud and typed by hand.
SUFFIX_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"
SUFFIX_LENGTH = 8

MAX_PREFIX = 32


def romanise(text: str) -> str:
    """Hebrew or Latin input to a lowercase ASCII slug fragment."""
    stripped = "".join(
        char for char in unicodedata.normalize("NFD", text) if not unicodedata.combining(char)
    )

    out: list[str] = []
    at_word_start = True
    for char in stripped:
        if char in HEBREW:
            out.append(
                WORD_INITIAL[char] if at_word_start and char in WORD_INITIAL else HEBREW[char]
            )
            at_word_start = False
        elif char.isascii() and char.isalnum():
            out.append(char.lower())
            at_word_start = False
        else:
            out.append("-")
            at_word_start = True

    # A trailing he is the feminine ending, and it is a vowel: `נועה` reads as
    # "noa", not "noah".
    joined = re.sub(r"h(?=-|$)", "", "".join(out))
    joined = re.sub(r"-+", "-", joined).strip("-")
    return joined[:MAX_PREFIX].strip("-")


def build_slug(couple_names: str) -> str:
    """A candidate slug. Uniqueness is the caller's problem, by retry."""
    prefix = romanise(couple_names)
    suffix = "".join(secrets.choice(SUFFIX_ALPHABET) for _ in range(SUFFIX_LENGTH))
    return f"{prefix}-{suffix}" if prefix else suffix
