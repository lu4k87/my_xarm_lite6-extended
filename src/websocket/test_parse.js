function recursivelyParseJSON(obj) {
    if (typeof obj === 'string') {
        const trimmed = obj.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            try { return recursivelyParseJSON(JSON.parse(trimmed)); } catch (e) { }
        }
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try { return recursivelyParseJSON(JSON.parse(trimmed)); } catch (e) { console.log("JSON.parse failed on: " + trimmed.substring(0, 50)); return obj; }
        }
        // Try fixing python dict representations
        let pyFixed = trimmed.replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false').replace(/None/g, 'null');
        if ((pyFixed.startsWith('{') && pyFixed.endsWith('}')) || (pyFixed.startsWith('[') && pyFixed.endsWith(']'))) {
             try { return recursivelyParseJSON(JSON.parse(pyFixed)); } catch (e) {}
        }

        // Unescape literal backslash+quote combos like \" manually as a last resort
        if (trimmed.includes('\\"')) {
            let unescaped = trimmed.replace(/\\"/g, '"');
            if ((unescaped.startsWith('{') && unescaped.endsWith('}')) || (unescaped.startsWith('[') && unescaped.endsWith(']'))) {
                try { return recursivelyParseJSON(JSON.parse(unescaped)); } catch (e) {}
            }
        }
        return obj;
    } else if (Array.isArray(obj)) {
        return obj.map(recursivelyParseJSON);
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) { newObj[key] = recursivelyParseJSON(obj[key]); }
        return newObj;
    }
    return obj;
}

const raw = `{"data": "{\\"\\\\"/dashboard/file_content\\\\"\\": {\\"hz\\": 0.0, \\"active\\": false, \\"last_msg\\": \\"\\"}, \\"\\\\"/dashboard/topic_activity\\\\"\\": {\\"hz\\": 2.0, \\"active\\": true, \\"last_msg\\": \\"{\\\\\\"data\\\\\\": \\\\\\"{\\\\\\\\\\"\\\\\\\\\\\\"/dashboard/file_content\\\\\\\\\\\\"\\\\\\\\\\": {\\\\\\\\\\"hz\\\\\\\\\\": 0.0}\\\\\\"}\\"}}"}`;

console.log("Raw:");
console.log(raw);
console.log("\nParsed:");
console.log(JSON.stringify(recursivelyParseJSON(raw), null, 2));
