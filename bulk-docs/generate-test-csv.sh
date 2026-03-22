#!/bin/bash

# Generate test CSV file for bulk import testing
# Usage: ./generate-test-csv.sh [rows] [output-file]
# Example: ./generate-test-csv.sh 500000 test-data.csv

set -e

ROWS=${1:-1000}
OUTPUT=${2:-test-data.csv}

echo "Generating test CSV with $ROWS rows..."
echo "Output file: $OUTPUT"

# Create header
echo "column1,column2,column3,column4,column5,column6,column7,column8,column9,column10" > "$OUTPUT"

# Generate rows
for i in $(seq 1 $ROWS); do
    COL1="PROD-$(printf '%06d' $i)"
    COL2="Product Name $i"
    COL3="Category-$(( i % 10 ))"
    COL4=$(( i * 100 ))
    COL5=$(( i % 100 )).$(( i % 100 ))
    COL6="USD"
    COL7=$(date -u -v+${i}d +"%Y-%m-%d" 2>/dev/null || date -u -d "+${i} days" +"%Y-%m-%d")
    COL8=$([ $(( i % 2 )) -eq 0 ] && echo "Active" || echo "Inactive")
    COL9=$([ $(( i % 3 )) -eq 0 ] && echo "High" || echo "Medium")
    COL10="Priority-$(( i % 5 ))"

    echo "$COL1,$COL2,$COL3,$COL4,$COL5,$COL6,$COL7,$COL8,$COL9,$COL10" >> "$OUTPUT"

    # Progress indicator
    if [ $(( i % 10000 )) -eq 0 ]; then
        echo "  Generated $i rows..."
    fi
done

FILE_SIZE=$(wc -c < "$OUTPUT" | tr -d ' ')
FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE / 1024 / 1024" | bc)

echo ""
echo "✅ CSV generation complete!"
echo "   Rows: $ROWS"
echo "   File: $OUTPUT"
echo "   Size: $FILE_SIZE_MB MB"
echo ""
echo "Test upload with:"
echo "  curl -X POST http://localhost:8080/api/v1/import/csv \\"
echo "    -F \"file=@$OUTPUT\""

