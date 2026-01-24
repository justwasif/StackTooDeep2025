import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
    {
        player1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        player2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'abandoned'],
            default: 'active'
        },
        winner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        endedAt: {
            type: Date
        }
    },
    { timestamps: true }
);

export const Match = mongoose.model("Match", matchSchema);
