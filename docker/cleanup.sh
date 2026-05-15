!/bin/bash
set -e

while getopts d:k: flag; do
    case "${flag}" in
        d) DIR=${OPTARG} ;;
        k) KEEP=${OPTARG} ;;
        *) echo "Usage: $0 -d <directory> -k <number_of_releases_to_keep>"; exit 1 ;;
    esac
done

if [[ -z "$DIR" || -z "$KEEP" || ! -d "$DIR" ]]; then
  echo "Usage: $0 -d <directory> -k <number_of_releases_to_keep>"
  exit 1
fi

cd "$DIR" || exit 1
echo "Removing older releases in $DIR, keeping the latest $KEEP..."
ls -dt */ | tail -n +$((KEEP+1)) | xargs -r rm -rf
echo "Cleanup complete!"
