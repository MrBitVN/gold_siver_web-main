import { useState } from "react";

export function useTranslate() {
    const [loading, setLoading] = useState(false);
    const [translated, setTranslated] = useState("");

    const translate = async (text) => {
        if (!text) return;

        setLoading(true);
        const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        const data = await res.json();
        setTranslated(data.translated);
        setLoading(false);
    };

    return { translate, translated, loading };
}
