import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FileCheck, Search, Filter, Download, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function StaffQIRList() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const { data: qirs, isLoading } = useQuery({
        queryKey: ["staff-qirs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("quality_inspections")
                .select(`
          *,
          job_card:job_cards(job_card_number, product_title),
          order:orders(order_number)
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const filteredQIRs = qirs?.filter((qir) => {
        const searchString = searchTerm.toLowerCase();
        const matchesSearch =
            qir.job_card?.job_card_number?.toLowerCase().includes(searchString) ||
            qir.order?.order_number?.toLowerCase().includes(searchString) ||
            qir.job_card?.product_title?.toLowerCase().includes(searchString);

        const matchesStatus =
            statusFilter === "all" || qir.qc_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pass":
                return "bg-green-500/10 text-green-600 border-green-200";
            case "fail":
                return "bg-red-500/10 text-red-600 border-red-200";
            default:
                return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
        }
    };

    return (
        <StaffLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-walnut">
                            Quality Reports
                        </h1>
                        <p className="text-walnut/60 mt-2">
                            Manage and review quality inspection reports
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="bg-white/80 backdrop-blur-md border border-gold/20">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Job Card, Order #, or Product..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 border-gold/20 focus:border-gold"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px] border-gold/20">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pass">Pass</SelectItem>
                                    <SelectItem value="fail">Fail</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* QIR List */}
                <div className="grid gap-4">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-walnut/60">Loading reports...</p>
                        </div>
                    ) : filteredQIRs && filteredQIRs.length > 0 ? (
                        filteredQIRs.map((qir) => (
                            <Card
                                key={qir.id}
                                className="bg-white/80 backdrop-blur-md border border-gold/10 hover:border-gold/30 transition-all duration-300"
                            >
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-semibold text-walnut">
                                                    {qir.job_card?.job_card_number || "Unknown Job Card"}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={getStatusColor(qir.qc_status || "pending")}
                                                >
                                                    {(qir.qc_status || "pending").toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-walnut/80 font-medium">
                                                {qir.job_card?.product_title || "Product"}
                                            </p>
                                            <p className="text-xs text-walnut/60">
                                                Order #{qir.order?.order_number || "—"} • Created on{" "}
                                                {new Date(qir.created_at).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden md:block">
                                                <p className="text-sm text-walnut/60">Overall Rating</p>
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="text-lg font-bold text-gold">
                                                        {Number(qir.overall_rating || 0).toFixed(1)}
                                                    </span>
                                                    <span className="text-sm text-walnut/40">/ 5.0</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Link to={`/staff/quality-reports/${qir.id}`}>
                                                    <Button variant="outline" size="sm" className="border-gold/20 hover:border-gold hover:text-gold">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white/50 rounded-lg border border-dashed border-gold/20">
                            <FileCheck className="h-12 w-12 mx-auto text-gold/40 mb-4" />
                            <h3 className="text-lg font-semibold text-walnut">
                                No Reports Found
                            </h3>
                            <p className="text-walnut/60">
                                {searchTerm || statusFilter !== "all"
                                    ? "Try adjusting your filters"
                                    : "Quality reports will appear here once generated"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </StaffLayout>
    );
}
