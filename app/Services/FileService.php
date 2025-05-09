<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class FileService
{
    /**
     * Get all files in the given directory
     *
     * @param string $directory
     * @return \Illuminate\Support\Collection
     */
    public function getFiles(string $directory = '')
    {
        return collect(Storage::files($directory));
    }

    /**
     * Get all directories in the given directory
     *
     * @param string $directory
     * @return \Illuminate\Support\Collection
     */
    public function getDirectories(string $directory = '')
    {
        return collect(Storage::directories($directory));
    }

    /**
     * Store a file
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $path
     * @param string $disk
     * @return string
     */
    public function storeFile($file, string $path = '', string $disk = 'public')
    {
        return $file->store($path, $disk);
    }

    /**
     * Delete a file
     *
     * @param string $path
     * @param string $disk
     * @return bool
     */
    public function deleteFile(string $path, string $disk = 'public')
    {
        return Storage::disk($disk)->delete($path);
    }
} 