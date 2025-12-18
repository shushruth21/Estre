import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EXPECTED_SCHEMA_VERSION } from "@/config/schema";
import { Loader2, AlertTriangle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SchemaGuardProps {
    children: React.ReactNode;
}

export const SchemaGuard = ({ children }: SchemaGuardProps) => {
    const [isChecking, setIsChecking] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentVersion, setCurrentVersion] = useState<number | null>(null);

    const checkSchema = async () => {
        try {
            setIsChecking(true);
            setError(null);

            // 1. Check if schema_meta table exists and get version
            const { data, error } = await supabase
                .from("schema_meta" as any)
                .select("version")
                .eq("id", 1)
                .single();

            if (error) {
                console.error("Schema check error:", error);
                // Special case: Table might not exist yet
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    throw new Error(`Critical Schema Error: 'schema_meta' table is missing. Please run migration 20251218000000_schema_contract.sql`);
                }
                throw new Error(`Failed to verify database schema: ${error.message}`);
            }

            if (!data) {
                throw new Error("Schema version record missing (id=1)");
            }

            setCurrentVersion(data.version);

            if (data.version !== EXPECTED_SCHEMA_VERSION) {
                throw new Error(
                    `Schema Version Mismatch: Expected v${EXPECTED_SCHEMA_VERSION}, found v${data.version}. Please run pending migrations.`
                );
            }

        } catch (err: any) {
            console.error("Schema guard failed:", err);
            setError(err.message || "Unknown schema error");
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        checkSchema();
    }, []);

    if (isChecking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Verifying System Integrity...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full border-l-4 border-red-600">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                        <AlertTriangle className="h-8 w-8" />
                        <h1 className="text-2xl font-bold">System Startup Error</h1>
                    </div>

                    <div className="mb-6 space-y-2">
                        <p className="font-semibold text-gray-900">Database Schema Mismatch</p>
                        <p className="text-gray-600 text-sm">
                            The application cannot start because the database schema does not match the expected version.
                        </p>
                    </div>

                    <div className="bg-gray-100 p-4 rounded mb-6 font-mono text-xs text-red-800 break-words whitespace-pre-wrap">
                        {error}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button onClick={checkSchema} className="w-full">
                            Retry Verification
                        </Button>
                        <p className="text-xs text-center text-gray-400 mt-4">
                            Expected: v{EXPECTED_SCHEMA_VERSION} {currentVersion && `| Found: v${currentVersion}`}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
