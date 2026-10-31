"""Strict draft contract. Missing source content stays null and blocks release."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False)


class Ref(Model):
    sourceId: str
    pageNumber: int | None = None
    bbox: list[float] | None = None
    blockId: str | None = None
    startTime: float | None = None
    endTime: float | None = None


class AudioRange(Model):
    assetId: str
    startTime: float
    endTime: float


class Option(Model):
    key: Literal["A", "B", "C", "D"]
    text: str | None
    sourceRefs: list[Ref] = Field(default_factory=list)


class Inline(Model):
    id: str
    type: Literal["text", "blank", "insertionPoint", "markedText"]
    text: str | None = None
    questionId: str | None = None


class Block(Model):
    id: str
    type: Literal["sourceRegion", "paragraph", "heading", "table", "image", "emailHeader", "chatMessage"]
    text: str | None = None
    # Raw regions deliberately do not masquerade as reconstructed layout.
    rows: list[list[str]] | None = None
    inline: list[Inline] = Field(default_factory=list)
    assetId: str | None = None
    vietnameseText: str | None = None
    sourceRefs: list[Ref]


class Passage(Model):
    id: str
    format: str | None = None
    blocks: list[Block]


class TranscriptLine(Model):
    id: str
    role: Literal["prompt", "option", "utterance"]
    speaker: str | None = None
    optionKey: str | None = None
    text: str
    vietnameseText: str | None = None
    sourceRefs: list[Ref]


class Question(Model):
    id: str
    questionNumber: int
    stem: str | None = None
    options: list[Option] = Field(default_factory=list)
    correctKey: str | None = None
    explanation: str | None = None
    vietnameseText: str | None = None
    vocabulary: list[dict[str, str]] = Field(default_factory=list)
    targetIds: list[str] = Field(default_factory=list)
    sourceRefs: list[Ref] = Field(default_factory=list)
    answerRefs: list[Ref] = Field(default_factory=list)


class Item(Model):
    id: str
    type: Literal["single", "group"]
    questions: list[Question]
    passages: list[Passage] = Field(default_factory=list)
    transcript: list[TranscriptLine] = Field(default_factory=list)
    itemAudio: AudioRange | None = None
    stimulusAudio: AudioRange | None = None
    media: list[Block] = Field(default_factory=list)


class Part(Model):
    partNumber: int
    section: Literal["listening", "reading"]
    items: list[Item]


class Test(Model):
    schemaVersion: Literal["0.1.0"] = "0.1.0"
    collectionId: str = "toeic_2024"
    testId: str
    testNumber: int
    title: str
    sourceManifestHash: str
    audioAssetId: str
    assets: list[dict]
    parts: list[Part]
